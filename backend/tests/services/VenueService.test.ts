import { describe, expect, it } from "vitest";
import { VenueService } from "../../src/services";
import { mockVenueRepository } from "../mocks";

describe("VenueService (unit)", () => {
    it("[getByCode] should retrieve venue by code from repository", async () => {
        const service = new VenueService(mockVenueRepository);
        await service.getByCode("Sample code");

        expect(mockVenueRepository.getByCode).toHaveBeenCalledWith(
            "Sample code"
        );
    });
});
