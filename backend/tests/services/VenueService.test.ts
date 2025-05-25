import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { VenueService } from "../../src/services";
import {
    createMockContainer,
    mockVenueRepository,
} from "../mocks/mockContainerFactory";

describe("VenueService (unit)", () => {
    beforeAll(createMockContainer);
    afterEach(vi.resetAllMocks.bind(vi));

    it("[getByCode] should retrieve venue by code from repository", async () => {
        const service = new VenueService(mockVenueRepository);
        await service.getByCode("Sample code");

        expect(mockVenueRepository.getByCode).toHaveBeenCalledWith(
            "Sample code"
        );
    });
});
