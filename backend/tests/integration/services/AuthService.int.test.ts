import { ILecturer, IStudent } from "@/database/schema";
import { dependencyTokens } from "@/dependencies/tokens";
import { FailedOperationResult, SuccessfulOperationResult } from "@/services";
import { UserRole } from "@/types";
import { encrypt } from "@/utils";
import { createMockRequest, createMockResponse } from "@test/mocks";
import { createTestContainer, seededPrimaryData } from "@test/setup";

describe("AuthService (integration)", () => {
    const container = createTestContainer();
    const service = container.resolve(dependencyTokens.authService);

    describe("login", () => {
        it("Should return 401 if user is not recognized", async () => {
            const result = (await service.login(
                "invalidUser",
                "password123"
            )) as FailedOperationResult;

            expect(result.isSuccessful()).toBe(false);
            expect(result.failed()).toBe(true);

            expect(result.status).toBe(401);
            expect(result.error).toBe("Invalid username or password.");
        });

        it("Should login student successfully with valid credentials", async () => {
            const student = seededPrimaryData.students[0];

            const result = (await service.login(
                student.matricNo,
                student.kpNo
            )) as SuccessfulOperationResult<IStudent>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.status).toBe(200);
            expect(result.data).toStrictEqual(student);
        });

        it("Should login lecturer successfully with valid credentials", async () => {
            const lecturer = seededPrimaryData.lecturers[0];

            const result = (await service.login(
                lecturer.workerNo.toString(),
                lecturer.workerNo.toString()
            )) as SuccessfulOperationResult<ILecturer>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.status).toBe(200);
            expect(result.data).toStrictEqual(lecturer);
        });
    });

    describe("createSession", () => {
        it("Should create a session cookie", () => {
            const student = seededPrimaryData.students[0];
            const mockResponse = createMockResponse();

            service.createSession(mockResponse, student);

            expect(mockResponse.cookie).toHaveBeenCalledExactlyOnceWith(
                "session",
                expect.any(String),
                expect.objectContaining({
                    httpOnly: true,
                    signed: true,
                    secure: false,
                    sameSite: "strict",
                    maxAge: 3600000,
                })
            );
        });
    });

    describe("verifySession", () => {
        let mockRequest: ReturnType<typeof createMockRequest>;
        let mockResponse: ReturnType<typeof createMockResponse>;
        let next: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            mockRequest = createMockRequest();
            mockResponse = createMockResponse();
            next = vi.fn();
        });

        it("Should return 401 if session cookie is not set", async () => {
            await service.verifySession(UserRole.student)(
                mockRequest,
                mockResponse,
                next
            );

            expect(mockResponse.status).toHaveBeenCalledExactlyOnceWith(401);
            expect(mockResponse.json).toHaveBeenCalledExactlyOnceWith({
                error: "Unauthorized",
            });

            expect(next).not.toHaveBeenCalled();
        });

        it("Should return 401 and clear session cookie if session cookie is invalid", async () => {
            mockRequest.signedCookies.session = "invalidSession";

            await service.verifySession(UserRole.student)(
                mockRequest,
                mockResponse,
                next
            );

            expect(mockResponse.status).toHaveBeenCalledExactlyOnceWith(401);
            expect(mockResponse.json).toHaveBeenCalledExactlyOnceWith({
                error: "Unauthorized",
            });

            expect(mockResponse.clearCookie).toHaveBeenCalledExactlyOnceWith(
                "session"
            );

            expect(next).not.toHaveBeenCalled();
        });

        it("Should return 401 for an unrecognized user", async () => {
            mockRequest.signedCookies.session = encrypt(
                JSON.stringify({ what: "the dog doin" })
            );

            await service.verifySession(UserRole.student)(
                mockRequest,
                mockResponse,
                next
            );

            expect(mockResponse.status).toHaveBeenCalledExactlyOnceWith(401);
            expect(mockResponse.json).toHaveBeenCalledExactlyOnceWith({
                error: "Unauthorized",
            });

            expect(next).not.toHaveBeenCalled();
        });

        it("Should return 403 if session cookie is for a different user role", async () => {
            const lecturer = seededPrimaryData.lecturers[0];

            mockRequest.signedCookies.session = encrypt(
                JSON.stringify(lecturer)
            );

            await service.verifySession(UserRole.student)(
                mockRequest,
                mockResponse,
                next
            );

            expect(mockResponse.status).toHaveBeenCalledExactlyOnceWith(403);
            expect(mockResponse.json).toHaveBeenCalledExactlyOnceWith({
                error: "Forbidden",
            });

            expect(next).not.toHaveBeenCalled();
        });

        it("Should call next if session is valid for student", async () => {
            const student = seededPrimaryData.students[0];

            mockRequest.signedCookies.session = encrypt(
                JSON.stringify(student)
            );

            await service.verifySession(UserRole.student)(
                mockRequest,
                mockResponse,
                next
            );

            expect(next).toHaveBeenCalledOnce();
        });

        it("Should call next if session is valid for lecturer", async () => {
            const lecturer = seededPrimaryData.lecturers[0];

            mockRequest.signedCookies.session = encrypt(
                JSON.stringify(lecturer)
            );

            await service.verifySession(UserRole.lecturer)(
                mockRequest,
                mockResponse,
                next
            );

            expect(next).toHaveBeenCalledOnce();
        });
    });
});
