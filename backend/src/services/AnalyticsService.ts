import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    ICourseRepository,
    IStudentRepository,
    IVenueRepository,
} from "@/repositories";
import {
    IAnalytics,
    IAnalyticsBackToBackStudent,
    IAnalyticsClashingStudent,
    IAnalyticsCourse,
    IAnalyticsCourseSchedule,
    IAnalyticsScheduleClash,
    IAnalyticsStudentDepartment,
    IRegisteredStudent,
    TTMSCourseCode,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { inject } from "tsyringe";
import { BaseService } from "./BaseService";
import { IAnalyticsService } from "./IAnalyticsService";
import { OperationResult } from "./OperationResult";
import { convertRawVenueClashTimetableToVenueClashTimetable } from "@/utils";

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
        private readonly venueRepository: IVenueRepository
    ) {
        super();
    }

    async generate(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<IAnalytics>> {
        const registeredStudents =
            await this.studentRepository.getRegisteredStudents(
                session,
                semester
            );

        // Group students by matric number
        const registeredStudentsMap = new Map<string, IRegisteredStudent[]>();

        for (const registeredStudent of registeredStudents) {
            if (
                !registeredStudentsMap.has(registeredStudent.student.matricNo)
            ) {
                registeredStudentsMap.set(
                    registeredStudent.student.matricNo,
                    []
                );
            }

            registeredStudentsMap
                .get(registeredStudent.student.matricNo)!
                .push(registeredStudent);
        }

        const schedules = await this.courseRepository.getSchedulesForAnalytics(
            session,
            semester
        );

        // Group schedules by course code, and then by section
        const schedulesMap = new Map<string, Map<string, IAnalyticsCourse>>();

        for (const schedule of schedules) {
            const courseCode = schedule.course.code;
            const section = schedule.section;

            if (!schedulesMap.has(courseCode)) {
                schedulesMap.set(courseCode, new Map());
            }

            schedulesMap.get(courseCode)!.set(section, schedule);
        }

        const analytics: IAnalytics = {
            activeStudents: registeredStudentsMap.size,
            backToBackStudents: [],
            clashingStudents: [],
            departments: [],
            venueClashes: convertRawVenueClashTimetableToVenueClashTimetable(
                await this.venueRepository.getVenueClashes(session, semester)
            ),
        };

        const departmentMap = new Map<
            TTMSCourseCode,
            IAnalyticsStudentDepartment
        >();

        for (const [matricNo, registeredStudent] of registeredStudentsMap) {
            const backToBackAnalyticsStudent: IAnalyticsBackToBackStudent = {
                matricNo,
                name: registeredStudent[0].student.name,
                courseCode: registeredStudent[0].student.courseCode,
                schedules: [],
            };

            const clashingAnalyticsStudent: IAnalyticsClashingStudent = {
                matricNo,
                name: registeredStudent[0].student.name,
                courseCode: registeredStudent[0].student.courseCode,
                clashes: [],
            };

            // Obtain all schedules of the student.
            const studentSchedules = registeredStudent
                .map((rs) => {
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
                .flat()
                .sort((a, b) => {
                    // Sort schedules by day and time, with day being a priority.
                    if (a.day !== b.day) {
                        return a.day - b.day;
                    }

                    return a.time - b.time;
                });

            const dayTimeMap = new Map<string, IAnalyticsScheduleClash[]>();
            const lastSchedules: IAnalyticsCourseSchedule[] = [];

            // Check if the student has back-to-back or clashing classes.
            // A student has back-to-back classes if they have classes for 5 consecutive hours or more.
            // A student has clashing classes if they have classes that overlap in time on the same day.
            for (let i = 0; i < studentSchedules.length; ++i) {
                const schedule = studentSchedules[i];

                // To check for back-to-back classes, check if the current schedule is consecutive
                // with the last one.
                if (i > 0) {
                    const lastSchedule = studentSchedules[i - 1];

                    if (
                        lastSchedule.day !== schedule.day ||
                        lastSchedule.time + 1 !== (schedule.time as number)
                    ) {
                        // The current schedule is not consecutive with the last one.
                        // We need to reset the last schedules if they are not consecutive, but before
                        // that, we check if the last schedules have 5 or more consecutive hours.
                        if (lastSchedules.length >= 5) {
                            backToBackAnalyticsStudent.schedules.push(
                                lastSchedules.slice()
                            );
                        }

                        lastSchedules.length = 0;
                    }
                }

                lastSchedules.push(schedule);

                // Now we check for clashing classes.
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
                if (dayTimeSchedules.length > 1) {
                    const lastClash = clashingAnalyticsStudent.clashes.at(-1);

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
                    } else {
                        clashingAnalyticsStudent.clashes.push({
                            day: schedule.day,
                            time: schedule.time,
                            courses: dayTimeSchedules.flatMap((ds) =>
                                ds.courses.map((c) => ({
                                    course: c.course,
                                    section: c.section,
                                    venue: c.venue,
                                }))
                            ),
                        });
                    }
                }
            }

            // Add the student to the department analytics.
            const departmentCode = registeredStudent[0].student.courseCode;

            if (!departmentMap.has(departmentCode)) {
                const departmentAnalytics: IAnalyticsStudentDepartment = {
                    code: departmentCode,
                    totalStudents: 0,
                    totalClashes: 0,
                    totalBackToBack: 0,
                };

                departmentMap.set(departmentCode, departmentAnalytics);
                analytics.departments.push(departmentAnalytics);
            }

            const departmentAnalytics = departmentMap.get(departmentCode)!;
            ++departmentAnalytics.totalStudents;

            // If the student has back-to-back classes, we add them to the analytics.
            if (backToBackAnalyticsStudent.schedules.length > 0) {
                analytics.backToBackStudents.push(backToBackAnalyticsStudent);
                ++departmentAnalytics.totalBackToBack;
            }

            // If the student has clashing classes, we add them to the analytics.
            if (clashingAnalyticsStudent.clashes.length > 0) {
                analytics.clashingStudents.push(clashingAnalyticsStudent);
                ++departmentAnalytics.totalClashes;
            }
        }

        // Sort departments by total students in descending order.
        analytics.departments.sort((a, b) => b.totalStudents - a.totalStudents);

        return this.createSuccessfulResponse(analytics);
    }
}
