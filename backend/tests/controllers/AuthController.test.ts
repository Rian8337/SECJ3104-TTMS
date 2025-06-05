import { AuthController } from "@/controllers";
import { ILecturer, IStudent } from "@/database/schema";
import { IAuthService } from "@/services";
import request from "supertest";
import {
    createMockRequest,
    createMockResponse,
    mockAuthService,
} from "../mocks";
import { app } from "../setup/app";
import { loginLecturer, loginStudent } from "../setup/auth";
import { seededPrimaryData } from "../setup/db";

describe("AuthController (unit)", () => {
    let controller: AuthController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new AuthController(mockAuthService as IAuthService);
        mockResponse = createMockResponse();
    });

    describe("login", () => {
        type Req = Partial<{ login: string; password: string }>;
        type Res = IStudent | ILecturer | { error: string };

        it("Should return 500 if an error occurs during login", async () => {
            mockAuthService.login.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C00000000", password: "password123" },
            });

            await controller.login(mockRequest, mockResponse);

            expect(mockAuthService.login).toHaveBeenCalledWith(
                "C00000000",
                "password123"
            );

            expect(mockAuthService.createSession).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
});

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
