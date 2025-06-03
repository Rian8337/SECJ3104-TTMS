import { beforeEach, describe, expect, it } from "vitest";
import { venues, VenueType } from "../../src/database/schema";
import { dependencyTokens } from "../../src/dependencies/tokens";
import { VenueRepository } from "../../src/repositories";
import { createMockDb } from "../mocks";
import { setupTestContainer } from "../setup/container";
import { seedVenue } from "../setup/db";

describe("VenueRepository (unit)", () => {
    let repository: VenueRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new VenueRepository(mockDb);
    });

    it("[getByCode] Should call database", async () => {
        mockDb.limit.mockResolvedValueOnce([]);

        await repository.getByCode("");

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledWith(venues);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.where).toHaveBeenCalled();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

        expect(mockDb.limit).toHaveBeenCalledWith(1);
        expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);
    });

    it("[getVenueClashes] Should call database", async () => {
        await repository.getVenueClashes("2024/2025", 2);

        expect(mockDb.selectDistinct).toHaveBeenCalledOnce();

        expect(mockDb.from).toHaveBeenCalledOnce();
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.selectDistinct);

        expect(mockDb.innerJoin).toHaveBeenCalledTimes(4);
        expect(mockDb.leftJoin).toHaveBeenCalledOnce();

        expect(mockDb.where).toHaveBeenCalledOnce();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.innerJoin);

        expect(mockDb.orderBy).toHaveBeenCalledOnce();
        expect(mockDb.orderBy).toHaveBeenCalledAfter(mockDb.where);

        expect(mockDb.execute).toHaveBeenCalledOnce();
        expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.orderBy);
    });
});

describe("VenueRepository (integration)", () => {
    const container = setupTestContainer();
    const repository = container.resolve(dependencyTokens.venueRepository);

    describe("getByCode", () => {
        it("Should return null if venue does not exist", async () => {
            const result = await repository.getByCode("NON_EXISTENT_VENUE");

            expect(result).toBeNull();
        });

        it("Should return venue if it exists", async () => {
            const venue = await seedVenue({
                code: "VENUE_101",
                capacity: 100,
                name: "Venue 101",
                shortName: "V101",
                type: VenueType.laboratory,
            });

            const fetchedVenue = await repository.getByCode("VENUE_101");

            expect(fetchedVenue).toEqual(venue);
        });
    });
});
