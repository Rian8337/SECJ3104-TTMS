import { VenueController } from "@/controllers";
import { IVenue } from "@/database/schema";
import { IVenueService } from "@/services";
import { CourseSectionScheduleDay, CourseSectionScheduleTime } from "@/types";
import {
    createMockRequest,
    createMockResponse,
    mockVenueService,
} from "@test/mocks";

describe("VenueController (unit)", () => {
    let controller: VenueController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new VenueController(mockVenueService as IVenueService);
        mockResponse = createMockResponse();
    });

    describe("getAvailableVenues", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            day: string;
            times: string;
        }>;

        type Res = IVenue[] | { error: string };

        it("Should return 500 if available venues retrieval throws an error", async () => {
            mockVenueService.getAvailableVenues.mockRejectedValueOnce(
                new Error("Database error")
            );

            const mockRequest = createMockRequest<
                "/available-venues",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    day: "2",
                    times: "2",
                },
            });

            await controller.getAvailableVenues(mockRequest, mockResponse);

            expect(
                mockVenueService.getAvailableVenues
            ).toHaveBeenCalledExactlyOnceWith(
                "2023/2024",
                1,
                CourseSectionScheduleDay.monday,
                [CourseSectionScheduleTime.time2]
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
});
