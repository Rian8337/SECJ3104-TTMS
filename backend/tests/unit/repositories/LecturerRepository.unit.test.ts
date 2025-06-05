import { DrizzleDb } from "@/database";
import { LecturerRepository } from "@/repositories";
import { createMockDb } from "@test/mocks";

describe("LecturerRepository (unit)", () => {
    let repository: LecturerRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new LecturerRepository(mockDb as unknown as DrizzleDb);
    });

    describe("searchByName", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 0)
            ).rejects.toThrow("Limit must be at least 1");
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 10, -1)
            ).rejects.toThrow("Offset must be at least 0");
        });
    });
});
