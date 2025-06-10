import { VenueService } from "@/services";
import { CourseSectionScheduleDay, CourseSectionScheduleTime } from "@/types";
import { mockVenueRepository } from "@test/mocks";

describe("VenueService (unit)", () => {
    it("[getByCode] should retrieve venue by code from repository", async () => {
        const service = new VenueService(mockVenueRepository);

        await service.getByCode("Sample code");

        expect(mockVenueRepository.getByCode).toHaveBeenCalledWith(
            "Sample code"
        );
    });

    it("[getAvailableVenues] should retrieve available venues from repository", async () => {
        const service = new VenueService(mockVenueRepository);

        await service.getAvailableVenues(
            "2023/2024",
            1,
            CourseSectionScheduleDay.monday,
            [
                CourseSectionScheduleTime.time2,
                CourseSectionScheduleTime.time3,
                CourseSectionScheduleTime.time4,
            ]
        );

        expect(mockVenueRepository.getAvailableVenues).toHaveBeenCalledWith(
            "2023/2024",
            1,
            CourseSectionScheduleDay.monday,
            [
                CourseSectionScheduleTime.time2,
                CourseSectionScheduleTime.time3,
                CourseSectionScheduleTime.time4,
            ]
        );
    });
});
