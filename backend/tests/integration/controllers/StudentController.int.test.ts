import {
    app,
    cleanupSecondaryTables,
    loginLecturer,
    loginStudent,
    seededPrimaryData,
    seeders,
} from "@test/setup";
import request from "supertest";

describe("StudentController (integration)", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("GET /student/timetable", () => {
        const session = seededPrimaryData.sessions[0];
        const endpoint = "/student/timetable";

        describe("Authentication", () => {
            it("Should return 401 for unauthenticated requests", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Unauthorized" });
            });

            it("Should not return 401 for student requests", async () => {
                await loginStudent(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });

            it("Should not return 401 for lecturer requests", async () => {
                await loginLecturer(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });
        });

        describe("Response", () => {
            const student = seededPrimaryData.students[0];

            beforeEach(async () => {
                await loginStudent(agent);
            });

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if matric number is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Matric number is required.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester.toString(),
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid session format. Expected format: YYYY/YYYY.",
                });
            });

            it("Should return 400 if semester is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: "4",
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return 200 and timetable if request is valid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toEqual([]);
            });
        });
    });

    describe("GET /student/search", () => {
        const session = seededPrimaryData.sessions[0];
        const endpoint = "/student/search";

        describe("Authentication", () => {
            it("Should return 401 for unauthenticated requests", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Unauthorized" });
            });

            it("Should not return 401 for student requests", async () => {
                await loginStudent(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });

            it("Should not return 401 for lecturer requests", async () => {
                await loginLecturer(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });
        });

        describe("Response", () => {
            const student = seededPrimaryData.students[0];

            beforeAll(async () => {
                const course = seededPrimaryData.courses[0];

                const section = await seeders.courseSection.seedOne({
                    courseCode: course.code,
                    section: "1",
                    semester: session.semester,
                    session: session.session,
                });

                await seeders.studentRegisteredCourse.seedOne({
                    courseCode: course.code,
                    section: section.section,
                    matricNo: student.matricNo,
                    semester: session.semester,
                    session: session.session,
                });
            });

            beforeEach(async () => {
                await loginStudent(agent);
            });

            afterAll(cleanupSecondaryTables);

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester.toString(),
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester.toString(),
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid session format. Expected format: YYYY/YYYY.",
                });
            });

            it("Should return 400 if semester is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: "4",
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return 400 if query is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Query is required",
                });
            });

            it("Should return 400 if limit is not a number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    limit: "not-a-number",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid limit",
                });
            });

            it("Should return 400 if limit is less than 1", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    limit: "-1",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid limit",
                });
            });

            it("Should return 400 if offset is not a number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    offset: "not-a-number",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid offset",
                });
            });

            it("Should return 400 if offset is less than 0", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    offset: "-1",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid offset",
                });
            });

            it("Should return search based on matric number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: student.matricNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toContainEqual({
                    matricNo: student.matricNo,
                    name: student.name,
                    courseCode: student.courseCode,
                });
            });

            it("Should return search based on name", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: student.name.split(" ")[0],
                });

                expect(res.status).toBe(200);
                expect(res.body).toContainEqual({
                    matricNo: student.matricNo,
                    name: student.name,
                    courseCode: student.courseCode,
                });
            });
        });
    });
});
