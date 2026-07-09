import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    ICourseRepository,
    IStudentRepository,
    IVenueRepository,
} from "@/repositories";
import {
    IAnalytics,
    IAnalyticsBackToBackSchedule,
    IAnalyticsBackToBackStudent,
    IAnalyticsClashingStudent,
    IAnalyticsCourse,
    IAnalyticsScheduleClash,
    IAnalyticsStudentDepartment,
    IRegisteredStudent,
    TTMSCourseCode,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { convertRawVenueClashTimetableToVenueClashTimetable } from "@/utils";
import { inject } from "tsyringe";
import { BaseService } from "./BaseService";
import { IAnalyticsService } from "./IAnalyticsService";
import { OperationResult } from "./OperationResult";

/**
 * The minimum number of consecutive hours of classes for a student to be considered
 * as having a back-to-back schedule.
 */
const MIN_BACK_TO_BACK_HOURS = 5;

/**
 * A service that is responsible for handling analytics-related operations.
 */
@Service(dependencyTokens.analyticsService)
export class AnalyticsService extends BaseService implements IAnalyticsService {
    constructor(
        @inject(dependencyTokens.studentRepository)
        private readonly studentRepository: IStudentRepository,
        @inject(dependencyTokens.courseRepository)
        private readonly courseRepository: ICourseRepository,
        @inject(dependencyTokens.venueRepository)
        private readonly venueRepository: IVenueRepository,
    ) {
        super();
    }

    async generate(
        session: TTMSSession,
        semester: TTMSSemester,
    ): Promise<OperationResult<IAnalytics>> {
        const registeredStudents =
            await this.studentRepository.getRegisteredStudents(
                session,
                semester,
            );

        const registeredStudentsMap =
            this.groupStudentsByMatricNo(registeredStudents);

        const schedules = await this.courseRepository.getSchedulesForAnalytics(
            session,
            semester,
        );

        const schedulesMap = this.groupSchedulesByCourseAndSection(schedules);

        const analytics: IAnalytics = {
            activeStudents: registeredStudentsMap.size,
            backToBackStudents: [],
            clashingStudents: [],
            departments: [],
            venueClashes: convertRawVenueClashTimetableToVenueClashTimetable(
                await this.venueRepository.getVenueClashes(session, semester),
            ),
        };

        const departmentMap = new Map<
            TTMSCourseCode,
            IAnalyticsStudentDepartment
        >();

        for (const [matricNo, registeredStudent] of registeredStudentsMap) {
            this.processRegisteredStudent(
                matricNo,
                registeredStudent,
                schedulesMap,
                analytics,
                departmentMap,
            );
        }

        // Sort departments by total students in descending order.
        analytics.departments.sort((a, b) => b.totalStudents - a.totalStudents);

        return this.createSuccessfulResponse(analytics);
    }

    /**
     * Groups registered students by their matric number.
     */
    private groupStudentsByMatricNo(
        registeredStudents: IRegisteredStudent[],
    ): Map<string, IRegisteredStudent[]> {
        const registeredStudentsMap = new Map<string, IRegisteredStudent[]>();

        for (const registeredStudent of registeredStudents) {
            const matricNo = registeredStudent.student.matricNo;

            if (!registeredStudentsMap.has(matricNo)) {
                registeredStudentsMap.set(matricNo, []);
            }

            registeredStudentsMap.get(matricNo)!.push(registeredStudent);
        }

        return registeredStudentsMap;
    }

    /**
     * Groups schedules by course code, and then by section.
     */
    private groupSchedulesByCourseAndSection(
        schedules: IAnalyticsCourse[],
    ): Map<string, Map<string, IAnalyticsCourse>> {
        const schedulesMap = new Map<string, Map<string, IAnalyticsCourse>>();

        for (const schedule of schedules) {
            const courseCode = schedule.course.code;

            if (!schedulesMap.has(courseCode)) {
                schedulesMap.set(courseCode, new Map());
            }

            schedulesMap.get(courseCode)!.set(schedule.section, schedule);
        }

        return schedulesMap;
    }

    /**
     * Processes a single student's registered courses, updating the analytics and
     * department maps with their back-to-back and clashing schedule information.
     */
    private processRegisteredStudent(
        matricNo: string,
        registeredStudent: IRegisteredStudent[],
        schedulesMap: Map<string, Map<string, IAnalyticsCourse>>,
        analytics: IAnalytics,
        departmentMap: Map<TTMSCourseCode, IAnalyticsStudentDepartment>,
    ) {
        const { student } = registeredStudent[0];

        const studentSchedules = this.buildStudentSchedules(
            registeredStudent,
            schedulesMap,
        );

        const { backToBackGroups, clashes } =
            this.analyzeStudentSchedules(studentSchedules);

        const departmentAnalytics = this.getOrCreateDepartmentAnalytics(
            student.courseCode,
            departmentMap,
            analytics,
        );

        ++departmentAnalytics.totalStudents;

        if (backToBackGroups.length > 0) {
            const backToBackAnalyticsStudent: IAnalyticsBackToBackStudent = {
                matricNo,
                name: student.name,
                courseCode: student.courseCode,
                schedules: backToBackGroups,
            };

            analytics.backToBackStudents.push(backToBackAnalyticsStudent);
            ++departmentAnalytics.totalBackToBack;
        }

        if (clashes.length > 0) {
            const clashingAnalyticsStudent: IAnalyticsClashingStudent = {
                matricNo,
                name: student.name,
                courseCode: student.courseCode,
                clashes,
            };

            analytics.clashingStudents.push(clashingAnalyticsStudent);
            ++departmentAnalytics.totalClashes;
        }
    }

    /**
     * Obtains all schedules of a student, sorted by day and time, with day being a priority.
     */
    private buildStudentSchedules(
        registeredStudent: IRegisteredStudent[],
        schedulesMap: Map<string, Map<string, IAnalyticsCourse>>,
    ): IAnalyticsBackToBackSchedule[] {
        return registeredStudent
            .flatMap((rs) => {
                const studentCourse = schedulesMap
                    .get(rs.courseCode)
                    ?.get(rs.section);

                return (
                    studentCourse?.schedules.map((schedule) => ({
                        day: schedule.day,
                        time: schedule.time,
                        venue: schedule.venue,
                        course: studentCourse.course,
                        section: rs.section,
                    })) ?? []
                );
            })
            .sort((a, b) =>
                a.day !== b.day ? a.day - b.day : a.time - b.time,
            );
    }

    /**
     * Checks if a student has back-to-back or clashing classes.
     *
     * A student has back-to-back classes if they have classes for
     * {@link MIN_BACK_TO_BACK_HOURS} consecutive hours or more. A student has clashing
     * classes if they have classes that overlap in time on the same day.
     */
    private analyzeStudentSchedules(
        studentSchedules: IAnalyticsBackToBackSchedule[],
    ): {
        backToBackGroups: IAnalyticsBackToBackSchedule[][];
        clashes: IAnalyticsScheduleClash[];
    } {
        const backToBackGroups: IAnalyticsBackToBackSchedule[][] = [];
        const clashes: IAnalyticsScheduleClash[] = [];
        const dayTimeMap = new Map<string, IAnalyticsScheduleClash[]>();
        const lastSchedules: IAnalyticsBackToBackSchedule[] = [];

        for (const schedule of studentSchedules) {
            this.trackBackToBackSchedule(
                schedule,
                lastSchedules,
                backToBackGroups,
            );

            this.trackClashingSchedule(schedule, dayTimeMap, clashes);
        }

        // Check for back-to-back after iteration, which would otherwise be ignored.
        this.pushBackToBackGroupIfEligible(lastSchedules, backToBackGroups);

        return { backToBackGroups, clashes };
    }

    /**
     * Tracks whether the current schedule extends the running back-to-back streak,
     * flushing the streak into `backToBackGroups` once it is broken.
     */
    private trackBackToBackSchedule(
        schedule: IAnalyticsBackToBackSchedule,
        lastSchedules: IAnalyticsBackToBackSchedule[],
        backToBackGroups: IAnalyticsBackToBackSchedule[][],
    ) {
        const lastSchedule = lastSchedules.at(-1);

        if (lastSchedule) {
            // Check if the current schedule is consecutive with the last one.
            const isConsecutive =
                lastSchedule.day === schedule.day &&
                schedule.time - lastSchedule.time === 1;

            if (!isConsecutive) {
                this.pushBackToBackGroupIfEligible(
                    lastSchedules,
                    backToBackGroups,
                );
                lastSchedules.length = 0;
            }
        }

        lastSchedules.push(schedule);
    }

    private pushBackToBackGroupIfEligible(
        lastSchedules: IAnalyticsBackToBackSchedule[],
        backToBackGroups: IAnalyticsBackToBackSchedule[][],
    ) {
        if (lastSchedules.length >= MIN_BACK_TO_BACK_HOURS) {
            backToBackGroups.push(lastSchedules.slice());
        }
    }

    /**
     * Tracks whether the current schedule clashes with another schedule on the same
     * day and time, merging it into the last clash entry when possible.
     */
    private trackClashingSchedule(
        schedule: IAnalyticsBackToBackSchedule,
        dayTimeMap: Map<string, IAnalyticsScheduleClash[]>,
        clashes: IAnalyticsScheduleClash[],
    ) {
        const key = `${schedule.day.toString()}-${schedule.time.toString()}`;

        if (!dayTimeMap.has(key)) {
            dayTimeMap.set(key, []);
        }

        const dayTimeSchedules = dayTimeMap.get(key)!;

        dayTimeSchedules.push({
            day: schedule.day,
            time: schedule.time,
            courses: [
                {
                    course: schedule.course,
                    section: schedule.section,
                    venue: schedule.venue,
                },
            ],
        });

        // If there are more than one schedules for the same day and time, we have a clash.
        if (dayTimeSchedules.length <= 1) {
            return;
        }

        const lastClash = clashes.at(-1);

        if (
            lastClash?.day === schedule.day &&
            lastClash.time === schedule.time
        ) {
            // If the last clash is for the same day and time, we can just add to it.
            lastClash.courses.push({
                course: schedule.course,
                section: schedule.section,
                venue: schedule.venue,
            });

            return;
        }

        clashes.push({
            day: schedule.day,
            time: schedule.time,
            courses: dayTimeSchedules.flatMap((ds) =>
                ds.courses.map((c) => ({
                    course: c.course,
                    section: c.section,
                    venue: c.venue,
                })),
            ),
        });
    }

    /**
     * Obtains the department analytics for the given department code, creating and
     * registering a new entry in `analytics.departments` if one does not exist yet.
     */
    private getOrCreateDepartmentAnalytics(
        departmentCode: TTMSCourseCode,
        departmentMap: Map<TTMSCourseCode, IAnalyticsStudentDepartment>,
        analytics: IAnalytics,
    ): IAnalyticsStudentDepartment {
        let departmentAnalytics = departmentMap.get(departmentCode);

        if (!departmentAnalytics) {
            departmentAnalytics = {
                code: departmentCode,
                totalStudents: 0,
                totalClashes: 0,
                totalBackToBack: 0,
            };

            departmentMap.set(departmentCode, departmentAnalytics);
            analytics.departments.push(departmentAnalytics);
        }

        return departmentAnalytics;
    }
}
