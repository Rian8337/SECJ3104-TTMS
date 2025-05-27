import { describe, it, expect } from "vitest";
import { SessionRepository } from "../../src/repositories";
import { mockDb } from "../mocks";
import { sessions } from "../../src/database/schema";

describe("SessionRepository (unit)", () => {
    it("Should call database", async () => {
        mockDb.select.mockReturnValueOnce({
            from: mockDb.from.mockResolvedValueOnce([]),
        });

        const repository = new SessionRepository(mockDb);

        await repository.getSessions();

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledWith(sessions);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
    });
});
