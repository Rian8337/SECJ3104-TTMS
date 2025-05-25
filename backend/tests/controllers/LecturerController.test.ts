import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { LecturerController } from "../../src/controllers";
import { ILecturer } from "../../src/database/schema";
import {
    createMockContainer,
    mockAuthService,
    mockLecturerService,
} from "../mocks/mockContainerFactory";
import {
    createMockRequest,
    createMockResponse,
} from "../mocks/expressMockFactory";
import { ITimetable, ITimetableClash } from "../../src/types";
import {
    FailedOperationResult,
    SuccessfulOperationResult,
} from "../../src/services";

describe("LecturerController (unit)", () => {
    beforeAll(createMockContainer);
    afterEach(vi.resetAllMocks.bind(vi));

    describe("login", () => {
        type Req = Partial<{ login: string; password: string }>;
        type Res = ILecturer | { error: string };

        const mockLecturer: ILecturer = {
            workerNo: 12345,
            name: "John Doe",
        };

        it("Should return 400 if login is missing", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>();
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Login and password are required.",
            });

            expect(mockLecturerService.getByWorkerNo).not.toHaveBeenCalled();
            expect(mockAuthService.createSession).not.toHaveBeenCalled();
        });

        it("Should return 400 if password is missing", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "12345" },
            });
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Login and password are required.",
            });

            expect(mockLecturerService.getByWorkerNo).not.toHaveBeenCalled();
            expect(mockAuthService.createSession).not.toHaveBeenCalled();
        });

        it("Should return 400 if login is not a number", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "abcde", password: "12345" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid login format.",
            });

            expect(mockLecturerService.getByWorkerNo).not.toHaveBeenCalled();
            expect(mockAuthService.createSession).not.toHaveBeenCalled();
        });

        it("Should return 401 if lecturer is not found", async () => {
            mockLecturerService.getByWorkerNo.mockResolvedValueOnce(null);

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "12345", password: "12345" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid username or password.",
            });

            expect(mockLecturerService.getByWorkerNo).toHaveBeenCalledWith(
                12345
            );
            expect(mockAuthService.createSession).not.toHaveBeenCalled();
        });

        it("Should return 401 if password is incorrect", async () => {
            mockLecturerService.getByWorkerNo.mockResolvedValueOnce(
                mockLecturer
            );

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "12345", password: "wrongpassword" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid username or password.",
            });

            expect(mockLecturerService.getByWorkerNo).toHaveBeenCalledWith(
                12345
            );
            expect(mockAuthService.createSession).not.toHaveBeenCalled();
        });

        it("Should create a session and return lecturer if login is successful", async () => {
            mockLecturerService.getByWorkerNo.mockResolvedValueOnce(
                mockLecturer
            );

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "12345", password: "12345" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockLecturer);

            expect(mockLecturerService.getByWorkerNo).toHaveBeenCalledWith(
                12345
            );
            expect(mockAuthService.createSession).toHaveBeenCalledWith(
                mockResponse,
                mockLecturer
            );
        });

        it("Should return 500 if an error occurs", async () => {
            mockLecturerService.getByWorkerNo.mockRejectedValueOnce(
                new Error("Database error")
            );

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "12345", password: "12345" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error.",
            });

            expect(mockLecturerService.getByWorkerNo).toHaveBeenCalledWith(
                12345
            );
            expect(mockAuthService.createSession).not.toHaveBeenCalled();
        });
    });

    it("[logout] should clear session and return 200", () => {
        const mockRequest = createMockRequest<"/logout">();
        const mockResponse = createMockResponse();

        const controller = new LecturerController(
            mockLecturerService,
            mockAuthService
        );

        controller.logout(mockRequest, mockResponse);

        expect(mockAuthService.clearSession).toHaveBeenCalledWith(mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);
    });

    describe("getTimetable", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            worker_no: string;
        }>;

        type Res = ITimetable[] | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >();
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Academic session is required.",
            });
        });

        it("Should return 400 if semester is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024" },
            });
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if worker_no is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", semester: "1" },
            });
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Worker number is required.",
            });
        });

        it("Should return 400 if worker_no is not a number", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "abcde",
                },
            });
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid worker number format.",
            });
        });

        it("Should return 400 if session format is invalid", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023-2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });
        });

        it("Should return 400 if semester is invalid", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "4",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return error if timetable retrieval fails", async () => {
            mockLecturerService.getTimetable.mockResolvedValueOnce({
                isSuccessful: () => false,
                failed: () => true,
                status: 500,
                error: "Database error",
            } as FailedOperationResult);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Database error",
            });
        });

        it("Should return timetable if all parameters are valid", async () => {
            const mockTimetable: ITimetable[] = [];

            mockLecturerService.getTimetable.mockResolvedValueOnce({
                isSuccessful: () => true,
                failed: () => false,
                status: 200,
                data: mockTimetable,
            } as SuccessfulOperationResult<ITimetable[]>);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );

            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockTimetable);
        });

        it("Should return 500 if an error occurs", async () => {
            mockLecturerService.getTimetable.mockRejectedValueOnce(
                new Error("Database error")
            );

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );
        });
    });

    describe("getClashingTimetable", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            worker_no: string;
        }>;

        type Res = ITimetableClash[] | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >();
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Academic session is required.",
            });
        });

        it("Should return 400 if semester is missing", async () => {
            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024" },
            });
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if worker_no is missing", async () => {
            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", semester: "1" },
            });
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Worker number is required.",
            });
        });

        it("Should return 400 if worker_no is not a number", async () => {
            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "abcde",
                },
            });
            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid worker number format.",
            });
        });

        it("Should return 400 if session format is invalid", async () => {
            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023-2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });
        });

        it("Should return 400 if semester is invalid", async () => {
            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "4",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return error if clashing timetable retrieval fails", async () => {
            mockLecturerService.getClashingTimetable.mockResolvedValueOnce({
                isSuccessful: () => false,
                failed: () => true,
                status: 500,
                error: "Database error",
            } as FailedOperationResult);

            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Database error",
            });
        });

        it("Should return clashing timetable if all parameters are valid", async () => {
            const mockClashingTimetable: ITimetableClash[] = [];

            mockLecturerService.getClashingTimetable.mockResolvedValueOnce({
                isSuccessful: () => true,
                failed: () => false,
                status: 200,
                data: mockClashingTimetable,
            } as SuccessfulOperationResult<ITimetableClash[]>);

            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(
                mockLecturerService.getClashingTimetable
            ).toHaveBeenCalledWith(12345, "2023/2024", 1);

            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(
                mockClashingTimetable
            );
        });

        it("Should return 500 if an error occurs", async () => {
            mockLecturerService.getClashingTimetable.mockRejectedValueOnce(
                new Error("Database error")
            );

            const mockRequest = createMockRequest<
                "/clashing-timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new LecturerController(
                mockLecturerService,
                mockAuthService
            );

            await controller.getClashingTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });

            expect(
                mockLecturerService.getClashingTimetable
            ).toHaveBeenCalledWith(12345, "2023/2024", 1);
        });
    });
});
