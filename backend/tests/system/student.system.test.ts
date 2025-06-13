import { ILecturer, IVenue } from "@/database/schema";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IStudentSearchEntry,
    ITimetable,
} from "@/types";
import {
    app,
    cleanupSecondaryTables,
    loginStudent,
    seededPrimaryData,
    seeders,
} from "@test/setup";
import request from "supertest";

describe("Student System Flow", () => {
    const [session, otherSession] = seededPrimaryData.sessions;
    const [student, otherStudent] = seededPrimaryData.students;
    const lecturer = seededPrimaryData.lecturers[0];

    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("Fetch student timetable", () => {
        const endpoint = "/student/timetable";

        const course = seededPrimaryData.courses[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const section = await seeders.courseSection.seedOne({
                session: session.session,
                semester: session.semester,
                courseCode: course.code,
                section: "1",
                lecturerNo: lecturer.workerNo,
            });

            await seeders.studentRegisteredCourse.seedOne({
                session: session.session,
                semester: session.semester,
                courseCode: course.code,
                section: section.section,
                matricNo: student.matricNo,
            });

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: course.code,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: course.code,
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
                matric_no: student.matricNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        describe("Authenticated requests", () => {
            beforeEach(async () => {
                await loginStudent(agent);
            });

            it("Should return 400 if session is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if matriculation number is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Matric number is required.",
                });
            });

            it("Should return 404 if student is not found", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    matric_no: "C9999999", // Non-existent student
                });

                expect(res.status).toBe(404);
                expect(res.body).toStrictEqual({ error: "Student not found" });
            });

            it("Should return 200 with student timetable for valid request", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    matric_no: student.matricNo,
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

    describe("Search students", () => {
        const endpoint = "/student/search";

        beforeAll(async () => {
            const course = seededPrimaryData.courses[0];

            const [section, otherSection] =
                await seeders.courseSection.seedMany(
                    {
                        session: session.session,
                        semester: session.semester,
                        courseCode: course.code,
                        section: "1",
                    },
                    {
                        session: otherSession.session,
                        semester: otherSession.semester,
                        courseCode: course.code,
                        section: "2",
                    }
                );

            await seeders.studentRegisteredCourse.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: course.code,
                    section: section.section,
                    matricNo: student.matricNo,
                },
                // Should not be included in search results
                {
                    session: otherSession.session,
                    semester: otherSession.semester,
                    courseCode: course.code,
                    section: otherSection.section,
                    matricNo: otherStudent.matricNo,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return 401 for unauthenticated requests", async () => {
            const res = await agent.get(endpoint).query({
                session: session.session,
                semester: session.semester,
                query: student.matricNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        describe("Authenticated requests", () => {
            beforeEach(async () => {
                await loginStudent(agent);
            });

            it("Should return 400 if session is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    query: student.matricNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toStrictEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is not provided", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    query: student.matricNo,
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
                    error: "Query is required",
                });
            });

            it("Should return 200 and an empty array for invalid query", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    query: "invalid-query",
                });

                expect(res.status).toBe(200);
                expect(res.body).toStrictEqual([]);
            });

            it("Should return 200 and an empty array for searching a student not registered in the session", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    query: otherStudent.matricNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toStrictEqual([]);
            });

            it("Should return 200 and an array of students matching the query by matric number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    query: student.matricNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
            });

            it("Should return 200 and an array of students matching the query by name", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    query: student.name.split(" ")[0],
                });

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(1);

                const result = res.body as IStudentSearchEntry[];

                expect(result[0]).toStrictEqual({
                    courseCode: student.courseCode,
                    matricNo: student.matricNo,
                    name: student.name,
                } satisfies IStudentSearchEntry);
            });
        });
    });

    describe("Fetch lecturer timetable", () => {
        const endpoint = "/lecturer/timetable";

        const course = seededPrimaryData.courses[0];
        const venue = seededPrimaryData.venues[0];

        beforeEach(async () => {
            await loginStudent(agent);
        });

        beforeAll(async () => {
            const section = await seeders.courseSection.seedOne({
                session: session.session,
                semester: session.semester,
                courseCode: course.code,
                section: "1",
                lecturerNo: lecturer.workerNo,
            });

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: course.code,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: course.code,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should fetch a lecturer's timetable", async () => {
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

    describe("Search lecturers", () => {
        const endpoint = "/lecturer/search";
        const course = seededPrimaryData.courses[0];

        beforeEach(async () => {
            await loginStudent(agent);
        });

        beforeAll(async () => {
            await seeders.courseSection.seedOne({
                session: session.session,
                semester: session.semester,
                courseCode: course.code,
                section: "1",
                lecturerNo: lecturer.workerNo,
            });
        });

        afterAll(cleanupSecondaryTables);

        it("Should search lecturer by name", async () => {
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
                name: lecturer.name,
                workerNo: lecturer.workerNo,
            } satisfies ILecturer);
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
