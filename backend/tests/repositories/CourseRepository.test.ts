import { describe, expect, it } from "vitest";
import { mockDb } from "../mocks";
import { CourseRepository } from "../../src/repositories";
import { courses } from "../../src/database/schema";

describe("CourseRepository (unit)", () => {
    it("Should call database", async () => {
        mockDb.select.mockReturnValueOnce({
            from: mockDb.from.mockReturnValueOnce({
                where: mockDb.where.mockReturnValueOnce({
                    limit: mockDb.limit.mockResolvedValueOnce([]),
                }),
            }),
        });

        const repository = new CourseRepository(mockDb);

        await repository.getCourseByCode("CS101");

        expect(mockDb.select).toHaveBeenCalled();
        expect(mockDb.from).toHaveBeenCalledWith(courses);
        expect(mockDb.where).toHaveBeenCalled();
        expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
});
