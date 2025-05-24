import { beforeEach, describe, expect, it, vi } from "vitest";
import { VenueType, type IVenue } from "../../src/database/schema";
import type { IVenueRepository } from "../../src/repositories/IVenueRepository";
import { VenueService } from "../../src/services";

describe("VenueService (unit)", () => {
    let service: VenueService;
    let mockRepository: Record<
        keyof IVenueRepository,
        ReturnType<typeof vi.fn>
    >;

    beforeEach(() => {
        mockRepository = {
            getByCode: vi.fn(
                (): IVenue => ({
                    code: "Sample code",
                    capacity: 100,
                    name: "Sample name",
                    shortName: "Sample short name",
                    type: VenueType.laboratory,
                })
            ),
        };

        service = new VenueService(mockRepository);
    });

    it("Returns venue by code", async () => {
        const venue = await service.getByCode("Sample code");

        expect(venue).toEqual({
            code: "Sample code",
            capacity: 100,
            name: "Sample name",
            shortName: "Sample short name",
            type: VenueType.laboratory,
        });

        expect(mockRepository.getByCode).toHaveBeenCalledWith("Sample code");
    });
});
