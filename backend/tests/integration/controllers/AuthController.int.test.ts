import {
    app,
    loginLecturer,
    loginStudent,
    seededPrimaryData,
} from "@test/setup";
import request from "supertest";

describe("AuthController (integration)", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("POST /auth/login", () => {
        const endpoint = "/auth/login";

        it("Should return 400 if login is missing", async () => {
            const res = await agent
                .post(endpoint)
                .send({ password: "password123" });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Login and password are required",
            });
        });

        it("Should return 400 if password is missing", async () => {
            const res = await agent.post(endpoint).send({ login: "C00000000" });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Login and password are required",
            });
        });

        it("Should return 401 for unrecognized login", async () => {
            const res = await agent
                .post(endpoint)
                .send({ login: "unknown", password: "password123" });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({
                error: "Invalid username or password.",
            });
        });

        it("Should return 200 and student data if login is successful", async () => {
            const student = seededPrimaryData.students[0];
            const res = await loginStudent(agent);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(student);
        });

        it("Should return 200 and lecturer data if login is successful", async () => {
            const lecturer = seededPrimaryData.lecturers[0];
            const res = await loginLecturer(agent);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(lecturer);
        });
    });

    describe("POST /auth/logout", () => {
        const endpoint = "/auth/logout";

        it("Should be restricted to non-authenticated users", async () => {
            const res = await agent.post(endpoint);

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
        });

        it("Should clear session and return 200", async () => {
            // First, log in to create a session
            await loginStudent(agent);

            const res = await agent.post(endpoint);

            expect(res.status).toBe(200);
        });
    });
});
