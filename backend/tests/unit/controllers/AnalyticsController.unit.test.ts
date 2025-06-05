import { AnalyticsController } from "@/controllers";
import { IAnalyticsService } from "@/services";
import { IAnalytics } from "@/types";
import {
    createMockRequest,
    createMockResponse,
    mockAnalyticsService,
} from "@test/mocks";

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

        it("Should return 500 if analytics generation throws an error", async () => {
            mockAnalyticsService.generate.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

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
                error: "Internal server error",
            });
        });
    });
});
