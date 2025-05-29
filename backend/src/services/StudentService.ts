import { IStudent } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { ICourseRepository, IStudentRepository } from "@/repositories";
import {
    IRegisteredStudent,
    IStudentAnalytics,
    IStudentAnalyticsBackToBackStudent,
    IStudentAnalyticsClashingStudent,
    IStudentAnalyticsCourse,
    IStudentAnalyticsCourseSchedule,
    IStudentAnalyticsDepartment,
    IStudentAnalyticsScheduleClash,
    IStudentSearchEntry,
    ITimetable,
    TTMSCourseCode,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { isValidMatricNumber } from "@/utils";
import { inject } from "tsyringe";
import { BaseService } from "./BaseService";
import { IStudentService } from "./IStudentService";
import { OperationResult } from "./OperationResult";

/**
 * A service that is responsible for handling student-related operations.
 */
@Service(dependencyTokens.studentService)
export class StudentService extends BaseService implements IStudentService {
    constructor(
        @inject(dependencyTokens.studentRepository)
        private readonly studentRepository: IStudentRepository,
        @inject(dependencyTokens.courseRepository)
        private readonly courseRepository: ICourseRepository
    ) {
        super();
    }

    async getByMatricNo(matricNo: string): Promise<IStudent | null> {
        return this.studentRepository.getByMatricNo(matricNo);
    }

    async getTimetable(
        matricNo: string,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<ITimetable[]>> {
        const student = await this.studentRepository.getByMatricNo(matricNo);

        if (!student) {
            return this.createFailedResponse("Student not found", 404);
        }

        const res = await this.studentRepository.getTimetable(
            student.matricNo,
            session,
            semester
        );

        return this.createSuccessfulResponse(res);
    }

    async search(
        session: TTMSSession,
        semester: TTMSSemester,
        query: string,
        limit = 10,
        offset = 0
    ): Promise<OperationResult<IStudentSearchEntry[]>> {
        if (query.length < 3) {
            return this.createFailedResponse(
                "Query must be at least 3 characters long"
            );
        }

        let res: IStudentSearchEntry[];

        // Names cannot contain digits, so assume that matric numbers are being searched in that case
        if (/\d/.test(query)) {
            if (!isValidMatricNumber(query)) {
                return this.createSuccessfulResponse([]);
            }

            res = await this.studentRepository.searchByMatricNo(
                session,
                semester,
                query,
                limit,
                offset
            );
        } else {
            res = await this.studentRepository.searchByName(
                session,
                semester,
                query,
                limit,
                offset
            );
        }

        return this.createSuccessfulResponse(res);
    }

    async generateAnalytics(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<IStudentAnalytics>> {
        const registeredStudents =
            await this.studentRepository.getRegisteredStudents(
                session,
                semester
            );

        if (registeredStudents.length === 0) {
            return this.createSuccessfulResponse({
                activeStudents: 0,
                backToBackStudents: [],
                clashingStudents: [],
                departments: [],
            });
        }

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
        const schedulesMap = new Map<
            string,
            Map<string, IStudentAnalyticsCourse>
        >();

        for (const schedule of schedules) {
            const courseCode = schedule.course.code;
            const section = schedule.section;

            if (!schedulesMap.has(courseCode)) {
                schedulesMap.set(courseCode, new Map());
            }

            schedulesMap.get(courseCode)!.set(section, schedule);
        }

        const analytics: IStudentAnalytics = {
            activeStudents: registeredStudentsMap.size,
            backToBackStudents: [],
            clashingStudents: [],
            departments: [],
        };

        const departmentMap = new Map<
            TTMSCourseCode,
            IStudentAnalyticsDepartment
        >();

        for (const [matricNo, registeredStudent] of registeredStudentsMap) {
            const backToBackAnalyticsStudent: IStudentAnalyticsBackToBackStudent =
                {
                    matricNo,
                    name: registeredStudent[0].student.name,
                    courseCode: registeredStudent[0].student.courseCode,
                    schedules: [],
                };

            const clashingAnalyticsStudent: IStudentAnalyticsClashingStudent = {
                matricNo,
                name: registeredStudent[0].student.name,
                courseCode: registeredStudent[0].student.courseCode,
                clashes: [],
            };

            const dayTimeMap = new Map<
                string,
                IStudentAnalyticsScheduleClash[]
            >();

            const lastSchedules: IStudentAnalyticsCourseSchedule[] = [];

            for (const registered of registeredStudent) {
                const studentCourse = schedulesMap
                    .get(registered.courseCode)
                    ?.get(registered.section);

                if (!studentCourse) {
                    // No schedules found for this course section.
                    continue;
                }

                const courseSchedules = studentCourse.schedules;

                // Sort schedules by day and time, with day being a priority.
                courseSchedules.sort((a, b) => {
                    if (a.day !== b.day) {
                        return a.day - b.day;
                    }

                    return a.time - b.time;
                });

                // Check if the student has back-to-back or clashing classes.
                // A student has back-to-back classes if they have classes for 5 consecutive hours or more.
                // A student has clashing classes if they have classes that overlap in time on the same day.
                for (let i = 0; i < courseSchedules.length; i++) {
                    const schedule = courseSchedules[i];

                    // To check for back-to-back classes, check if the current schedule is consecutive
                    // with the last one.
                    if (i > 0) {
                        const lastSchedule = courseSchedules[i - 1];

                        if (
                            lastSchedule.day !== schedule.day ||
                            (lastSchedule.time as number) !== schedule.time + 1
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
                                course: studentCourse.course,
                                section: registered.section,
                                venue: schedule.venue,
                            },
                        ],
                    });

                    // If there are more than one schedules for the same day and time, we have a clash.
                    if (dayTimeSchedules.length > 1) {
                        const lastClash =
                            clashingAnalyticsStudent.clashes.at(-1);

                        if (
                            lastClash?.day === schedule.day &&
                            lastClash.time === schedule.time
                        ) {
                            // If the last clash is for the same day and time, we can just add to it.
                            lastClash.courses.push({
                                course: studentCourse.course,
                                section: registered.section,
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
            }

            // Add the student to the department analytics.
            const departmentCode = registeredStudent[0].student.courseCode;

            if (!departmentMap.has(departmentCode)) {
                const departmentAnalytics: IStudentAnalyticsDepartment = {
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
