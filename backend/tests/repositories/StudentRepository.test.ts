import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { studentRegisteredCourses, students } from "../../src/database/schema";
import { StudentRepository } from "../../src/repositories";
import { createMockDb } from "../mocks";

describe("StudentRepository (unit)", () => {
    let repository: StudentRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new StudentRepository(mockDb);
    });

    it("[getByMatricNo] Should query database", async () => {
        mockDb.limit.mockResolvedValueOnce([]);

        await repository.getByMatricNo("123456");

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(students);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.where).toHaveBeenCalledOnce();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

        expect(mockDb.limit).toHaveBeenCalledExactlyOnceWith(1);
        expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);
    });

    describe("getTimetable", () => {
        it("Should query database", async () => {
            await repository.getTimetable("123456", "2023/2024", "1");

            expect(mockDb.select).toHaveBeenCalledOnce();
            expect(mockDb.from).toHaveBeenCalledOnce();
            expect(mockDb.innerJoin).toHaveBeenCalledTimes(3);
            expect(mockDb.leftJoin).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenCalledOnce();
            expect(mockDb.orderBy).toHaveBeenCalledOnce();
            expect(mockDb.execute).toHaveBeenCalledOnce();
        });
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

        it("Should query database with matric number match expression", async () => {
            await repository.searchByMatricNo("2024/2025", 1, "123456", 10, 0);

            expect(mockDb.select).toHaveBeenCalledTimes(2);
            expect(mockDb.select).toHaveBeenNthCalledWith(1, {
                matricNo: students.matricNo,
                name: students.name,
                courseCode: students.courseCode,
            });
            expect(mockDb.select).toHaveBeenNthCalledWith(2, {
                exists: sql`1`,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(2);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
            expect(mockDb.from).toHaveBeenNthCalledWith(1, students);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                2,
                studentRegisteredCourses
            );

            expect(mockDb.where).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.limit).toHaveBeenCalledExactlyOnceWith(10);
            expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.offset).toHaveBeenCalledExactlyOnceWith(0);
            expect(mockDb.offset).toHaveBeenCalledAfter(mockDb.limit);
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

        it("Should query database with name match expression", async () => {
            mockDb.execute.mockResolvedValue([]);

            await repository.searchByName("2024/2025", 1, "John Doe", 10, 0);

            expect(mockDb.select).toHaveBeenCalledTimes(3);
            expect(mockDb.select).toHaveBeenNthCalledWith(3, {
                exists: sql`1`,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(3);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
            expect(mockDb.from).toHaveBeenNthCalledWith(1, students);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                3,
                studentRegisteredCourses
            );

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
