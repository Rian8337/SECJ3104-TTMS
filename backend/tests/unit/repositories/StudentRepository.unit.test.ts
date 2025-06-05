import { DrizzleDb } from "@/database";
import { StudentRepository } from "@/repositories";
import { createMockDb } from "@test/mocks";

describe("StudentRepository (unit)", () => {
    let repository: StudentRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new StudentRepository(mockDb as unknown as DrizzleDb);
    });

    describe("searchByMatricNo", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByMatricNo("2024/2025", 1, "123456", 0)
            ).rejects.toThrow("Limit must be greater than 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByMatricNo("2024/2025", 1, "123456", 10, -1)
            ).rejects.toThrow("Offset must be greater than or equal to 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });
    });

    describe("searchByName", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 0)
            ).rejects.toThrow("Limit must be greater than 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 10, -1)
            ).rejects.toThrow("Offset must be greater than or equal to 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });
    });
});
