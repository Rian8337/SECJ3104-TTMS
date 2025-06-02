import { beforeEach, describe, expect, it } from "vitest";
import { sessions } from "../../src/database/schema";
import { SessionRepository } from "../../src/repositories";
import { createMockDb } from "../mocks";

describe("SessionRepository (unit)", () => {
    let repository: SessionRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new SessionRepository(mockDb);
    });

    it("Should call database", async () => {
        await repository.getSessions();

        expect(mockDb.select).toHaveBeenCalled();
        expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(sessions);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
    });
});
