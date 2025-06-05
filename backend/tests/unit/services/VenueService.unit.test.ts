import { VenueService } from "@/services";
import { mockVenueRepository } from "@test/mocks";

describe("VenueService (unit)", () => {
    it("[getByCode] should retrieve venue by code from repository", async () => {
        const service = new VenueService(mockVenueRepository);

        await service.getByCode("Sample code");

        expect(mockVenueRepository.getByCode).toHaveBeenCalledWith(
            "Sample code"
        );
    });
});
