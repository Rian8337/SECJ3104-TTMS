import { describe, expect, it } from "vitest";
import { venues } from "../../src/database/schema";
import { VenueRepository } from "../../src/repositories";
import { createMockDb } from "../mocks";

describe("VenueRepository (unit)", () => {
    it("Should call database", async () => {
        const mockDb = createMockDb();
        const repository = new VenueRepository(mockDb);

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
});
