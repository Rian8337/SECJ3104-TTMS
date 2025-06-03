import { LecturerController } from "@/controllers";
import { ITimetable } from "@/types";
import {
    createFailedOperationResultMock,
    createMockRequest,
    createMockResponse,
    createSuccessfulOperationResultMock,
    mockLecturerService,
} from "../mocks";
import { ILecturerService } from "@/services";

describe("LecturerController (unit)", () => {
    let controller: LecturerController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new LecturerController(
            mockLecturerService as ILecturerService
        );

        mockResponse = createMockResponse();
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

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return error if timetable retrieval fails", async () => {
            const result = createFailedOperationResultMock(
                "Database error",
                500
            );

            mockLecturerService.getTimetable.mockResolvedValueOnce(result);

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

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Database error",
            });
        });

        it("Should return timetable if all parameters are valid", async () => {
            const mockTimetable: ITimetable[] = [];
            const result = createSuccessfulOperationResultMock(mockTimetable);

            mockLecturerService.getTimetable.mockResolvedValueOnce(result);

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

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(200);
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
});
