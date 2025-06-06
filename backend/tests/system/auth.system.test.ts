import request from "supertest";
import {
    app,
    loginLecturer,
    loginStudent,
    seededPrimaryData,
} from "@test/setup";
import { sleep } from "@/utils";

describe("Auth System Flow", () => {
    const session = seededPrimaryData.sessions[0];
    const student = seededPrimaryData.students[0];
    const lecturer = seededPrimaryData.lecturers[0];

    const studentOnlyEndpoint = "/student/timetable";
    const lecturerOnlyEndpoint = "/lecturer/venue-clash";

    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("Student Login", () => {
        it("Should login student and receive a session cookie", async () => {
            const res = await loginStudent(agent);

            expect(res.status).toBe(200);
            expect(res.headers["set-cookie"]).toBeInstanceOf(Array);
            expect(res.headers["set-cookie"]).toHaveLength(1);

            const sessionCookie = res.headers["set-cookie"][0];

            expect(sessionCookie).toMatch(/session/);
            expect(sessionCookie).toMatch(/HttpOnly/);
            expect(sessionCookie).toMatch(/Max-Age=3600/);
        });

        it("Should access student-only endpoint after login", async () => {
            await loginStudent(agent);

            const res = await agent.get(studentOnlyEndpoint).query({
                session: session.session,
                semester: session.semester,
                matric_no: student.matricNo,
            });

            expect(res.status).toBe(200);
        });

        it("Should be forbidden from accessing lecturer-only endpoint", async () => {
            await loginStudent(agent);

            const res = await agent.get(lecturerOnlyEndpoint).query({
                session: session.session,
                semester: session.semester,
                worker_no: lecturer.workerNo,
            });

            expect(res.status).toBe(403);
            expect(res.body).toStrictEqual({ error: "Forbidden" });
        });
    });

    describe("Lecturer Login", () => {
        it("Should login lecturer and receive a session cookie", async () => {
            const res = await loginLecturer(agent);

            expect(res.status).toBe(200);
            expect(res.headers["set-cookie"]).toBeInstanceOf(Array);
            expect(res.headers["set-cookie"]).toHaveLength(1);

            const sessionCookie = res.headers["set-cookie"][0];

            expect(sessionCookie).toMatch(/session/);
            expect(sessionCookie).toMatch(/HttpOnly/);
            expect(sessionCookie).toMatch(/Max-Age=3600/);
        });

        it("Should access lecturer-only endpoint after login", async () => {
            await loginLecturer(agent);

            const res = await agent.get(lecturerOnlyEndpoint).query({
                session: session.session,
                semester: session.semester,
                worker_no: lecturer.workerNo,
            });

            expect(res.status).toBe(200);
        });

        // P.S. We do not have a student-only endpoint to test here.
    });

    describe("Session Behavior", () => {
        beforeAll(() => {
            vi.useFakeTimers();
        });

        afterAll(vi.useRealTimers.bind(vi));

        it("Should reject access if no session cookie is present", async () => {
            const res = await agent.get(studentOnlyEndpoint).query({
                session: session.session,
                semester: session.semester,
                matric_no: student.matricNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        it("Should reject access if session is cleared (logout)", async () => {
            await loginStudent(agent);

            // Logout to clear session
            await agent.post("/auth/logout");

            const res = await agent.get(studentOnlyEndpoint).query({
                session: session.session,
                semester: session.semester,
                matric_no: student.matricNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });

        it("Should reject access if session is expired", async () => {
            const loginRes = await loginStudent(agent);

            expect(loginRes.status).toBe(200);
            expect(loginRes.headers["set-cookie"]).toBeInstanceOf(Array);
            expect(loginRes.headers["set-cookie"]).toHaveLength(1);

            const sessionCookie = loginRes.headers["set-cookie"][0];

            expect(sessionCookie).toMatch(/session/);
            expect(sessionCookie).toMatch(/Max-Age=3600/);

            // Obtain expiry time from the cookie
            const sessionMatch = /Max-Age=(\d+)/.exec(sessionCookie);
            expect(sessionMatch).toBeTruthy();

            const maxAge = parseInt(sessionMatch![1]);

            // Wait for session to expire
            const expiryTime = maxAge * 1000;
            const sleeper = sleep(expiryTime);

            // Advance time by maxAge + 1 second to ensure expiry
            vi.advanceTimersByTime(expiryTime + 1000);

            await sleeper;

            const res = await agent.get(studentOnlyEndpoint).query({
                session: session.session,
                semester: session.semester,
                matric_no: student.matricNo,
            });

            expect(res.status).toBe(401);
            expect(res.body).toStrictEqual({ error: "Unauthorized" });
        });
    });
});
