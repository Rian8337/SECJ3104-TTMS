import { AnalyticsService, SuccessfulOperationResult } from "@/services";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IAnalytics,
    IAnalyticsBackToBackStudent,
    IAnalyticsClashingStudent,
    IAnalyticsStudentDepartment,
    IVenueClashTimetable,
} from "@/types";
import {
    mockCourseRepository,
    mockStudentRepository,
    mockVenueRepository,
} from "../mocks";
import { seededPrimaryData } from "../setup/db";

describe("AnalyticsService (unit)", () => {
    let service: AnalyticsService;

    beforeEach(() => {
        service = new AnalyticsService(
            mockStudentRepository,
            mockCourseRepository,
            mockVenueRepository
        );
    });

    it("[generate] Should return proper analytics", async () => {
        const [firstCourse, secondCourse] = seededPrimaryData.courses;
        const student = seededPrimaryData.students[0];
        const venue = seededPrimaryData.venues[0];

        mockStudentRepository.getRegisteredStudents.mockResolvedValueOnce([
            {
                courseCode: firstCourse.code,
                student: {
                    name: student.name,
                    matricNo: student.matricNo,
                    courseCode: student.courseCode,
                },
                section: "1",
            },
            {
                courseCode: secondCourse.code,
                student: {
                    name: student.name,
                    matricNo: student.matricNo,
                    courseCode: student.courseCode,
                },
                section: "1",
            },
        ]);

        mockCourseRepository.getSchedulesForAnalytics.mockResolvedValueOnce([
            {
                course: {
                    code: firstCourse.code,
                    name: firstCourse.name,
                },
                section: "1",
                schedules: [
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time2,
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time3,
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time4,
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time5,
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time6,
                        venue: { shortName: venue.shortName },
                    },
                ],
            },
            {
                course: {
                    code: secondCourse.code,
                    name: secondCourse.name,
                },
                section: "1",
                schedules: [
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time2,
                        venue: { shortName: venue.shortName },
                    },
                ],
            },
        ]);

        mockVenueRepository.getVenueClashes.mockResolvedValueOnce([
            {
                courseCode: firstCourse.code,
                courseName: firstCourse.name,
                lecturerName: null,
                lecturerNo: null,
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                scheduleVenue: venue.shortName,
                section: "1",
            },
            {
                courseCode: secondCourse.code,
                courseName: secondCourse.name,
                lecturerName: null,
                lecturerNo: null,
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                scheduleVenue: venue.shortName,
                section: "1",
            },
        ]);

        const result = (await service.generate(
            "2023/2024",
            1
        )) as SuccessfulOperationResult<IAnalytics>;

        expect(result.status).toBe(200);

        expect(result.data.backToBackStudents).toHaveLength(1);

        expect(result.data.backToBackStudents[0]).toStrictEqual({
            courseCode: student.courseCode,
            matricNo: student.matricNo,
            name: student.name,
            schedules: [
                [
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time2,
                        course: {
                            code: secondCourse.code,
                            name: secondCourse.name,
                        },
                        section: "1",
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time3,
                        course: {
                            code: firstCourse.code,
                            name: firstCourse.name,
                        },
                        section: "1",
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time4,
                        course: {
                            code: firstCourse.code,
                            name: firstCourse.name,
                        },
                        section: "1",
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time5,
                        course: {
                            code: firstCourse.code,
                            name: firstCourse.name,
                        },
                        section: "1",
                        venue: { shortName: venue.shortName },
                    },
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time6,
                        course: {
                            code: firstCourse.code,
                            name: firstCourse.name,
                        },
                        section: "1",
                        venue: { shortName: venue.shortName },
                    },
                ],
            ],
        } satisfies IAnalyticsBackToBackStudent);

        expect(result.data.clashingStudents).toHaveLength(1);

        expect(result.data.clashingStudents[0]).toStrictEqual({
            courseCode: student.courseCode,
            matricNo: student.matricNo,
            name: student.name,
            clashes: [
                {
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    courses: [
                        {
                            course: {
                                code: firstCourse.code,
                                name: firstCourse.name,
                            },
                            section: "1",
                            venue: { shortName: venue.shortName },
                        },
                        {
                            course: {
                                code: secondCourse.code,
                                name: secondCourse.name,
                            },
                            section: "1",
                            venue: { shortName: venue.shortName },
                        },
                    ],
                },
            ],
        } satisfies IAnalyticsClashingStudent);

        expect(result.data.venueClashes).toHaveLength(1);

        expect(result.data.venueClashes[0]).toStrictEqual({
            day: CourseSectionScheduleDay.monday,
            time: CourseSectionScheduleTime.time2,
            venue: { shortName: venue.shortName },
            courseSections: [
                {
                    course: {
                        code: firstCourse.code,
                        name: firstCourse.name,
                    },
                    lecturer: null,
                    section: "1",
                },
                {
                    course: {
                        code: secondCourse.code,
                        name: secondCourse.name,
                    },
                    lecturer: null,
                    section: "1",
                },
            ],
        } satisfies IVenueClashTimetable);

        expect(result.data.departments).toHaveLength(1);

        expect(result.data.departments[0]).toStrictEqual({
            code: student.courseCode,
            totalBackToBack: 1,
            totalClashes: 1,
            totalStudents: 1,
        } satisfies IAnalyticsStudentDepartment);
    });
});
