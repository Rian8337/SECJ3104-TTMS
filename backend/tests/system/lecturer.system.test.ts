import { ILecturer, IVenue } from "@/database/schema";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IAnalytics,
    IAnalyticsBackToBackStudent,
    IAnalyticsClashingStudent,
    IAnalyticsStudentDepartment,
    ITimetable,
    ITimetableCourseSection,
    IVenueClashTimetable,
} from "@/types";
import {
    app,
    cleanupSecondaryTables,
    loginLecturer,
    loginStudent,
    seededPrimaryData,
    seeders,
} from "@test/setup";
import request from "supertest";

describe("Lecturer System Flow", () => {
    const [session, otherSession] = seededPrimaryData.sessions;
    const [lecturer, otherLecturer] = seededPrimaryData.lecturers;

    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("Fetch lecturer timetable", () => {
        const endpoint = "/lecturer/timetable";

        const course = seededPrimaryData.courses[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const section = await seeders.courseSection.seedOne({
                courseCode: course.code,
                section: "1",
                session: session.session,
                semester: session.semester,
                lecturerNo: lecturer.workerNo,
            });

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: section.session,
                    semester: section.semester,
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    session: section.session,
                    semester: section.semester,
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return 401 for unauthenticated requests", async () => {
            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
                worker_no: lecturer.workerNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        describe("Authenticated requests", () => {
            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    worker_no: lecturer.workerNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    worker_no: lecturer.workerNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if worker number is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Worker number is required.",
                });
            });

            it("Should return 200 with timetable data for valid request", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    worker_no: lecturer.workerNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(2);

                const result = res.body as ITimetable[];

                expect(result[0]).toStrictEqual({
                    courseSection: {
                        course: {
                            code: course.code,
                            name: course.name,
                        },
                        lecturer,
                        section: "1",
                    },
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venue: { shortName: venue.shortName },
                } satisfies ITimetable);

                expect(result[1]).toStrictEqual({
                    courseSection: {
                        course: {
                            code: course.code,
                            name: course.name,
                        },
                        lecturer,
                        section: "1",
                    },
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venue: { shortName: venue.shortName },
                } satisfies ITimetable);
            });
        });
    });

    describe("Fetch venue clash timetable", () => {
        const endpoint = "/lecturer/venue-clash";

        const course = seededPrimaryData.courses[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const [firstSection, secondSection] =
                await seeders.courseSection.seedMany(
                    {
                        courseCode: course.code,
                        section: "1",
                        session: session.session,
                        semester: session.semester,
                        lecturerNo: lecturer.workerNo,
                    },
                    {
                        courseCode: course.code,
                        section: "2",
                        session: session.session,
                        semester: session.semester,
                        lecturerNo: otherLecturer.workerNo,
                    },
                    // Should not be included in the results.
                    {
                        courseCode: course.code,
                        section: "1",
                        session: otherSession.session,
                        semester: otherSession.semester,
                        lecturerNo: otherLecturer.workerNo,
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: firstSection.session,
                    semester: firstSection.semester,
                    courseCode: firstSection.courseCode,
                    section: firstSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    session: secondSection.session,
                    semester: secondSection.semester,
                    courseCode: secondSection.courseCode,
                    section: secondSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                // Should not be included in the results.
                {
                    session: otherSession.session,
                    semester: otherSession.semester,
                    courseCode: course.code,
                    section: "1",
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return 401 for unauthenticated requests", async () => {
            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
                worker_no: lecturer.workerNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        it("Should return 403 for non-lecturer authenticated requests", async () => {
            await loginStudent(agent);

            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
                worker_no: lecturer.workerNo,
            });

            expect(res.status).toBe(403);
            expect(res.body).toStrictEqual({ error: "Forbidden" });
        });

        describe("Authenticated requests", () => {
            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    worker_no: lecturer.workerNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    worker_no: lecturer.workerNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if worker number is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Worker number is required.",
                });
            });

            it("Should return 200 with empty venue clash timetable data for a different session", async () => {
                const res = await agent.get(endpoint).query({
                    session: otherSession.session,
                    semester: otherSession.semester,
                    worker_no: lecturer.workerNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(0);
            });

            it("Should return 200 with venue clash timetable data for valid request", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    worker_no: lecturer.workerNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(1);

                const result = res.body as IVenueClashTimetable[];

                expect(result[0]).toStrictEqual({
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venue: { shortName: venue.shortName },
                    courseSections: [
                        {
                            course: {
                                code: course.code,
                                name: course.name,
                            },
                            lecturer,
                            section: "1",
                        },
                    ],
                } satisfies IVenueClashTimetable);
            });
        });
    });

    describe("Search lecturers", () => {
        const endpoint = "/lecturer/search";

        beforeAll(async () => {
            const course = seededPrimaryData.courses[0];

            await seeders.courseSection.seedMany(
                {
                    courseCode: course.code,
                    section: "1",
                    session: session.session,
                    semester: session.semester,
                    lecturerNo: lecturer.workerNo,
                },
                // Should not be included in the results.
                {
                    courseCode: course.code,
                    section: "1",
                    session: otherSession.session,
                    semester: otherSession.semester,
                    lecturerNo: otherLecturer.workerNo,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return 401 for unauthenticated requests", async () => {
            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
                query: lecturer.workerNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        describe("Authenticated requests", () => {
            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    query: lecturer.workerNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    query: lecturer.workerNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if query is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Query is required.",
                });
            });

            it("Should return 200 with empty lecturer search results for a different session", async () => {
                const res = await agent.get(endpoint).query({
                    session: otherSession.session,
                    semester: otherSession.semester,
                    query: lecturer.name.split(" ")[1],
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(0);
            });

            it("Should return 200 with lecturer search results for valid request", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    query: lecturer.name.split(" ")[1],
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(1);

                const result = res.body as ILecturer[];

                expect(result[0]).toStrictEqual({
                    workerNo: lecturer.workerNo,
                    name: lecturer.name,
                } satisfies ILecturer);
            });
        });
    });

    describe("Get analytics", () => {
        const endpoint = "/analytics/generate";
        const [firstCourse, secondCourse] = seededPrimaryData.courses;
        const otherLecturer = seededPrimaryData.lecturers[1];
        const student = seededPrimaryData.students[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const [firstSection, secondSection] =
                await seeders.courseSection.seedMany(
                    {
                        courseCode: firstCourse.code,
                        section: "1",
                        session: session.session,
                        semester: session.semester,
                        lecturerNo: lecturer.workerNo,
                    },
                    {
                        courseCode: secondCourse.code,
                        section: "1",
                        session: session.session,
                        semester: session.semester,
                        lecturerNo: otherLecturer.workerNo,
                    },
                    // Should not be included in the results.
                    {
                        courseCode: firstCourse.code,
                        section: "1",
                        session: otherSession.session,
                        semester: otherSession.semester,
                        lecturerNo: otherLecturer.workerNo,
                    }
                );

            await seeders.studentRegisteredCourse.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    matricNo: student.matricNo,
                },
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: secondCourse.code,
                    section: secondSection.section,
                    matricNo: student.matricNo,
                },
                // Should not be included in the results.
                {
                    session: otherSession.session,
                    semester: otherSession.semester,
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    matricNo: student.matricNo,
                }
            );

            await seeders.courseSectionSchedule.seedMany(
                {
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                },
                {
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time4,
                    venueCode: venue.code,
                },
                {
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time5,
                    venueCode: venue.code,
                },
                {
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time6,
                    venueCode: venue.code,
                },
                {
                    courseCode: secondCourse.code,
                    section: secondSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                // Should not be included in the results.
                {
                    courseCode: firstCourse.code,
                    section: firstSection.section,
                    session: otherSession.session,
                    semester: otherSession.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return 401 for unauthenticated requests", async () => {
            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        it("Should return 401 for non-lecturer authenticated requests", async () => {
            await loginStudent(agent);

            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
            });

            expect(res.status).toBe(403);
            expect(res.body).toStrictEqual({ error: "Forbidden" });
        });

        describe("Authenticated requests", () => {
            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 200 with different analytics data for a different session", async () => {
                const res = await agent.get(endpoint).query({
                    session: otherSession.session,
                    semester: otherSession.semester,
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Object);

                const result = res.body as IAnalytics;

                expect(result.activeStudents).toBe(1);

                expect(result.backToBackStudents).toBeInstanceOf(Array);
                expect(result.backToBackStudents).toHaveLength(0);

                expect(result.clashingStudents).toBeInstanceOf(Array);
                expect(result.clashingStudents).toHaveLength(0);

                expect(result.venueClashes).toBeInstanceOf(Array);
                expect(result.venueClashes).toHaveLength(0);

                expect(result.departments).toBeInstanceOf(Array);
                expect(result.departments).toHaveLength(1);

                expect(result.departments[0]).toStrictEqual({
                    code: student.courseCode,
                    totalBackToBack: 0,
                    totalClashes: 0,
                    totalStudents: 1,
                } satisfies IAnalyticsStudentDepartment);
            });

            it("Should return 200 with analytics data for valid request", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Object);

                const result = res.body as IAnalytics;

                expect(result.activeStudents).toBe(1);

                expect(result.backToBackStudents).toBeInstanceOf(Array);
                expect(result.backToBackStudents).toHaveLength(1);

                expect(result.backToBackStudents[0]).toStrictEqual({
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

                expect(result.clashingStudents).toBeInstanceOf(Array);
                expect(result.clashingStudents).toHaveLength(1);

                expect(result.clashingStudents[0]).toStrictEqual({
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

                expect(result.venueClashes).toBeInstanceOf(Array);
                expect(result.venueClashes).toHaveLength(1);

                // This fails in CI if toStrictEqual is used due to different ordering,
                // so we check properties individually.
                const clash = result.venueClashes[0];

                expect(clash.day).toBe(CourseSectionScheduleDay.monday);
                expect(clash.time).toBe(CourseSectionScheduleTime.time2);
                expect(clash.venue).toStrictEqual({
                    shortName: venue.shortName,
                });
                expect(clash.courseSections).toBeInstanceOf(Array);
                expect(clash.courseSections).toHaveLength(2);

                expect(clash.courseSections).toContainEqual({
                    course: {
                        code: firstCourse.code,
                        name: firstCourse.name,
                    },
                    lecturer,
                    section: "1",
                } satisfies ITimetableCourseSection);

                expect(clash.courseSections).toContainEqual({
                    course: {
                        code: secondCourse.code,
                        name: secondCourse.name,
                    },
                    lecturer: otherLecturer,
                    section: "1",
                } satisfies ITimetableCourseSection);

                expect(result.departments).toBeInstanceOf(Array);
                expect(result.departments).toHaveLength(1);

                expect(result.departments[0]).toStrictEqual({
                    code: student.courseCode,
                    totalBackToBack: 1,
                    totalClashes: 1,
                    totalStudents: 1,
                } satisfies IAnalyticsStudentDepartment);
            });
        });
    });

    describe("Fetch available venues", () => {
        const endpoint = "/venue/available-venues";
        const session = seededPrimaryData.sessions[0];
        const [venue, otherVenue] = seededPrimaryData.venues;

        beforeEach(async () => {
            await loginStudent(agent);
        });

        beforeAll(async () => {
            const course = seededPrimaryData.courses[0];

            const section = await seeders.courseSection.seedOne({
                session: session.session,
                semester: session.semester,
                courseCode: course.code,
                section: "1",
            });

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    session: section.session,
                    semester: section.semester,
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return available venues for a given academic session and semester", async () => {
            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
                day: CourseSectionScheduleDay.monday.toString(),
                times: CourseSectionScheduleTime.time2.toString(),
            });

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(1);

            const result = res.body as IVenue[];

            expect(result[0]).toStrictEqual(otherVenue);
        });
    });
});
