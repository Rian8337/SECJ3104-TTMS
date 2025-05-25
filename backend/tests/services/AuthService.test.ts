import { describe, expect, it, vi } from "vitest";
import { ILecturer, IStudent } from "../../src/database/schema";
import { AuthService } from "../../src/services";
import { UserRole } from "../../src/types";
import { encrypt } from "../../src/utils";
import {
    createMockRequest,
    createMockResponse,
} from "../utils/expressMockFactory";

describe("AuthService (unit)", () => {
    const authService = new AuthService();

    const mockResponse = createMockResponse();

    it("Should create a session cookie", () => {
        authService.createSession(mockResponse, { test: "test" });

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

    it("Should clear a session cookie", () => {
        authService.clearSession(mockResponse);

        expect(mockResponse.clearCookie).toHaveBeenCalledWith("session");
    });

    describe("Session verification", () => {
        const next = vi.fn();

        it("Should return 401 if no session cookie is present", async () => {
            const mockRequest = createMockRequest();

            await authService.verifySession()(mockRequest, mockResponse, next);

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

            await authService.verifySession()(mockRequest, mockResponse, next);

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

            await authService.verifySession(UserRole.lecturer)(
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

            await authService.verifySession()(mockRequest, mockResponse, next);

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

            await authService.verifySession(UserRole.lecturer)(
                mockRequest,
                mockResponse,
                next
            );

            expect(next).toHaveBeenCalled();
        });
    });
});
