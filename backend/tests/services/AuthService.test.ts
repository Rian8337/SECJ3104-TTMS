import { beforeEach, describe, expect, it, vi } from "vitest";
import { ILecturer, IStudent } from "../../src/database/schema";
import {
    AuthService,
    FailedOperationResult,
    SuccessfulOperationResult,
} from "../../src/services";
import { UserRole } from "../../src/types";
import { encrypt } from "../../src/utils";
import {
    createMockRequest,
    createMockResponse,
    mockLecturerRepository,
    mockStudentRepository,
} from "../mocks";

describe("AuthService (unit)", () => {
    let service: AuthService;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        service = new AuthService(
            mockStudentRepository,
            mockLecturerRepository
        );

        mockResponse = createMockResponse();
    });

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

        describe("Student login", () => {
            const mockStudent: IStudent = {
                matricNo: "C00EC0000",
                name: "John Doe",
                courseCode: "SECVH",
                facultyCode: "FC",
                kpNo: "123456789012",
            };

            it("Should return 401 if password is an invalid KP number", async () => {
                const result = (await service.login(
                    mockStudent.matricNo,
                    "invalidKP"
                )) as FailedOperationResult;

                expect(
                    mockStudentRepository.getByMatricNo
                ).not.toHaveBeenCalled();

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return 401 if student not found", async () => {
                mockStudentRepository.getByMatricNo.mockResolvedValue(null);

                const result = (await service.login(
                    "C00EC0001",
                    mockStudent.kpNo
                )) as FailedOperationResult;

                expect(
                    mockStudentRepository.getByMatricNo
                ).toHaveBeenCalledWith("C00EC0001");

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return 401 if password is incorrect", async () => {
                mockStudentRepository.getByMatricNo.mockResolvedValue(
                    mockStudent
                );

                const result = (await service.login(
                    mockStudent.matricNo,
                    "123456789011"
                )) as FailedOperationResult;

                expect(
                    mockStudentRepository.getByMatricNo
                ).toHaveBeenCalledWith(mockStudent.matricNo);

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return student if login is successful", async () => {
                mockStudentRepository.getByMatricNo.mockResolvedValue(
                    mockStudent
                );

                const result = (await service.login(
                    mockStudent.matricNo,
                    mockStudent.kpNo
                )) as SuccessfulOperationResult<IStudent>;

                expect(
                    mockStudentRepository.getByMatricNo
                ).toHaveBeenCalledWith(mockStudent.matricNo);

                expect(result.isSuccessful()).toBe(true);
                expect(result.failed()).toBe(false);

                expect(result.status).toBe(200);
                expect(result.data).toEqual(mockStudent);
            });
        });

        describe("Lecturer login", () => {
            const mockLecturer: ILecturer = {
                workerNo: 12345,
                name: "John Doe",
            };

            it("Should return 401 if login is not a number", async () => {
                const result = (await service.login(
                    "invalidLogin",
                    "password123"
                )) as FailedOperationResult;

                expect(
                    mockLecturerRepository.getByWorkerNo
                ).not.toHaveBeenCalled();

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return 401 if lecturer is not found", async () => {
                mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce(
                    null
                );

                const result = (await service.login(
                    mockLecturer.workerNo.toString(),
                    mockLecturer.workerNo.toString()
                )) as FailedOperationResult;

                expect(
                    mockLecturerRepository.getByWorkerNo
                ).toHaveBeenCalledWith(mockLecturer.workerNo);

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return 401 if password is incorrect", async () => {
                mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce(
                    mockLecturer
                );

                const result = (await service.login(
                    mockLecturer.workerNo.toString(),
                    "wrongPassword"
                )) as FailedOperationResult;

                expect(
                    mockLecturerRepository.getByWorkerNo
                ).toHaveBeenCalledWith(mockLecturer.workerNo);

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return lecturer if login is successful", async () => {
                mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce(
                    mockLecturer
                );

                const result = (await service.login(
                    mockLecturer.workerNo.toString(),
                    mockLecturer.workerNo.toString()
                )) as SuccessfulOperationResult<ILecturer>;

                expect(
                    mockLecturerRepository.getByWorkerNo
                ).toHaveBeenCalledWith(mockLecturer.workerNo);

                expect(result.isSuccessful()).toBe(true);
                expect(result.failed()).toBe(false);

                expect(result.status).toBe(200);
                expect(result.data).toEqual(mockLecturer);
            });
        });
    });

    it("[createSession] Should create a session cookie", () => {
        service.createSession(mockResponse, { test: "test" });

        expect(mockResponse.cookie).toHaveBeenCalledWith(
            "session",
            expect.any(String),
            {
                httpOnly: true,
                signed: true,
                secure: false,
                sameSite: "strict",
                maxAge: 3600000,
            }
        );
    });

    it("[clearSession] Should clear the session cookie", () => {
        service.clearSession(mockResponse);

        expect(mockResponse.clearCookie).toHaveBeenCalledWith("session");
    });

    describe("verifySession", () => {
        const next = vi.fn();

        it("Should return 401 if no session cookie is present", async () => {
            const mockRequest = createMockRequest();

            await service.verifySession()(mockRequest, mockResponse, next);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Unauthorized",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("Should return 401 and clear session if session cookie is invalid", async () => {
            const mockRequest = createMockRequest({
                signedCookies: { session: "invalid" },
            });

            await service.verifySession()(mockRequest, mockResponse, next);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Unauthorized",
            });
            expect(next).not.toHaveBeenCalled();
            expect(mockResponse.clearCookie).toHaveBeenCalledWith("session");
        });

        it("Should return 403 if user role is not allowed", async () => {
            const mockRequest = createMockRequest({
                signedCookies: {
                    session: encrypt(
                        JSON.stringify({
                            name: "Test student",
                            courseCode: "Test course",
                            facultyCode: "Test faculty",
                            matricNo: "Test matric",
                            kpNo: "Test kp",
                        } satisfies IStudent)
                    ),
                },
            });

            await service.verifySession(UserRole.lecturer)(
                mockRequest,
                mockResponse,
                next
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Forbidden",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("Should return 401 if user role is not recognized", async () => {
            const mockRequest = createMockRequest({
                signedCookies: {
                    session: encrypt(
                        JSON.stringify({
                            name: "Test user",
                            unrecognizedField: "value",
                        })
                    ),
                },
            });

            await service.verifySession()(mockRequest, mockResponse, next);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Unauthorized",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("Should call next if user is authenticated and no role is specified", async () => {
            const mockRequest = createMockRequest({
                signedCookies: {
                    session: encrypt(
                        JSON.stringify({
                            name: "Test student",
                            courseCode: "Test course",
                            facultyCode: "Test faculty",
                            matricNo: "Test matric",
                            kpNo: "Test kp",
                        } satisfies IStudent)
                    ),
                },
            });

            await service.verifySession()(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalled();
        });

        it("Should call next if user role is allowed", async () => {
            const mockRequest = createMockRequest({
                signedCookies: {
                    session: encrypt(
                        JSON.stringify({
                            name: "Test lecturer",
                            workerNo: 19391378,
                        } satisfies ILecturer)
                    ),
                },
            });

            await service.verifySession(UserRole.lecturer)(
                mockRequest,
                mockResponse,
                next
            );

            expect(next).toHaveBeenCalled();
        });
    });
});
