import { describe, expect, it } from "vitest";
import { VenueRepository } from "../../src/repositories";
import { mockDb } from "../mocks/drizzleMock";
import { venues } from "../../src/database/schema";

describe("VenueRepository (unit)", () => {
    it("Should call database", async () => {
        mockDb.select.mockReturnValueOnce({
            from: mockDb.from.mockReturnValueOnce({
                where: mockDb.where.mockReturnValueOnce({
                    limit: mockDb.limit.mockResolvedValueOnce([]),
                }),
            }),
        });

        const repository = new VenueRepository(mockDb);

        await repository.getByCode("");

        expect(mockDb.select).toHaveBeenCalled();
        expect(mockDb.from).toHaveBeenCalledWith(venues);
        expect(mockDb.where).toHaveBeenCalled();
        expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
});
