import { beforeEach, describe, expect, it } from "vitest";
import { courseSections, lecturers } from "../../src/database/schema";
import { LecturerRepository } from "../../src/repositories";
import { createMockDb } from "../mocks";

describe("LecturerRepository (unit)", () => {
    let repository: LecturerRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new LecturerRepository(mockDb);
    });

    it("[getByWorkerNo] Should query database", async () => {
        mockDb.limit.mockResolvedValueOnce([]);

        await repository.getByWorkerNo(12345);

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledWith(lecturers);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.where).toHaveBeenCalled();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

        expect(mockDb.limit).toHaveBeenCalledWith(1);
        expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);
    });

    it("[getTimetable] Should query database", async () => {
        await repository.getTimetable(12345, "2023/2024", "1");

        expect(mockDb.select).toHaveBeenCalledOnce();

        expect(mockDb.from).toHaveBeenCalledOnce();
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.innerJoin).toHaveBeenCalledTimes(3);

        expect(mockDb.where).toHaveBeenCalledOnce();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.innerJoin);

        expect(mockDb.orderBy).toHaveBeenCalledOnce();
        expect(mockDb.orderBy).toHaveBeenCalledAfter(mockDb.where);

        expect(mockDb.execute).toHaveBeenCalledOnce();
        expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.orderBy);
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

        it("Should query database", async () => {
            const name = "John Doe";

            await repository.searchByName("2024/2025", 1, name, 10, 0);

            expect(mockDb.select).toHaveBeenCalledTimes(3);

            expect(mockDb.from).toHaveBeenCalledTimes(3);
            expect(mockDb.from).toHaveBeenNthCalledWith(1, lecturers);
            expect(mockDb.from).toHaveBeenNthCalledWith(3, courseSections);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.orderBy).toHaveBeenCalledOnce();
            expect(mockDb.orderBy).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.limit).toHaveBeenCalledExactlyOnceWith(10);
            expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.orderBy);

            expect(mockDb.offset).toHaveBeenCalledExactlyOnceWith(0);
            expect(mockDb.offset).toHaveBeenCalledAfter(mockDb.limit);

            expect(mockDb.execute).toHaveBeenCalledExactlyOnceWith({
                name: "+JOHN* +DOE*",
            });
            expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.offset);
        });
    });
});
