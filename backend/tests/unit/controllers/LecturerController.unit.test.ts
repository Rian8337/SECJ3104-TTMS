import { LecturerController } from "@/controllers";
import { ILecturerService } from "@/services";
import { ITimetable, IVenueClashTimetable } from "@/types";
import {
    createMockRequest,
    createMockResponse,
    mockLecturerService,
} from "@test/mocks";

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

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });

    describe("getVenueClash", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            worker_no: string;
        }>;

        type Res = IVenueClashTimetable[] | { error: string };

        it("Should return 500 if an error occurs", async () => {
            mockLecturerService.getVenueClashes.mockRejectedValueOnce(
                new Error("Database error")
            );

            const mockRequest = createMockRequest<
                "/venue-clash",
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

            await controller.getVenueClash(mockRequest, mockResponse);

            expect(mockLecturerService.getVenueClashes).toHaveBeenCalledWith(
                "2023/2024",
                1,
                12345
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });

    describe("search", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            query: string;
            limit: string;
            offset: string;
        }>;

        type Res = { name: string; workerNo: number }[] | { error: string };

        it("Should return 500 if an error occurs", async () => {
            mockLecturerService.search.mockRejectedValueOnce(
                new Error("Database error")
            );

            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockLecturerService.search).toHaveBeenCalledWith(
                "2023/2024",
                1,
                "John",
                10,
                0
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
});
