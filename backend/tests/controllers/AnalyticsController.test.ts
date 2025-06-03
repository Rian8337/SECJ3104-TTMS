import { AnalyticsController } from "@/controllers";
import { IAnalyticsService } from "@/services";
import { IAnalytics } from "@/types";
import {
    createFailedOperationResultMock,
    createMockRequest,
    createMockResponse,
    createSuccessfulOperationResultMock,
    mockAnalyticsService,
} from "../mocks";

describe("AnalyticsController (unit)", () => {
    let controller: AnalyticsController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new AnalyticsController(
            mockAnalyticsService as IAnalyticsService
        );

        mockResponse = createMockResponse();
    });

    describe("generate", () => {
        type Req = Partial<{ session: string; semester: string }>;
        type Res = IAnalytics | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<"/generate", Res, Req>({
                query: { semester: "1" },
            });

            await controller.generate(mockRequest, mockResponse);

            expect(mockAnalyticsService.generate).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Academic session is required.",
            });
        });

        it("Should return 400 if semester is missing", async () => {
            const mockRequest = createMockRequest<"/generate", Res, Req>({
                query: { session: "2023/2024" },
            });

            await controller.generate(mockRequest, mockResponse);

            expect(mockAnalyticsService.generate).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if session is invalid", async () => {
            const mockRequest = createMockRequest<"/generate", Res, Req>({
                query: { session: "invalid", semester: "1" },
            });

            await controller.generate(mockRequest, mockResponse);

            expect(mockAnalyticsService.generate).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });
        });

        it("Should return 400 if semester is invalid", async () => {
            const mockRequest = createMockRequest<"/generate", Res, Req>({
                query: { session: "2023/2024", semester: "invalid" },
            });

            await controller.generate(mockRequest, mockResponse);

            expect(mockAnalyticsService.generate).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return error if analytics generation fails", async () => {
            const result = createFailedOperationResultMock(
                "Failed to generate analytics",
                500
            );

            mockAnalyticsService.generate.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<"/generate", Res, Req>({
                query: { session: "2023/2024", semester: "1" },
            });

            await controller.generate(mockRequest, mockResponse);

            expect(mockAnalyticsService.generate).toHaveBeenCalledWith(
                "2023/2024",
                1
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Failed to generate analytics",
            });
        });

        it("Should return analytics data if generation is successful", async () => {
            const result = createSuccessfulOperationResultMock<IAnalytics>({
                activeStudents: 0,
                backToBackStudents: [],
                clashingStudents: [],
                departments: [],
                venueClashes: [],
            });

            mockAnalyticsService.generate.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<"/generate", Res, Req>({
                query: { session: "2023/2024", semester: "1" },
            });

            await controller.generate(mockRequest, mockResponse);

            expect(mockAnalyticsService.generate).toHaveBeenCalledWith(
                "2023/2024",
                1
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(result.data);
        });
    });
});
