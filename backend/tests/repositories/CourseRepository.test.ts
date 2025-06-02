import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { courses, courseSections } from "../../src/database/schema";
import { dependencyTokens } from "../../src/dependencies/tokens";
import { CourseRepository } from "../../src/repositories";
import { createMockDb } from "../mocks";
import { setupTestContainer } from "../setup/container";
import { resetDb, seedCourse } from "../setup/db";

describe("CourseRepository (unit)", () => {
    let repository: CourseRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new CourseRepository(mockDb);
    });

    it("[getByCode] Should call database", async () => {
        mockDb.limit.mockResolvedValueOnce([]);

        await repository.getByCode("CS101");

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(courses);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.where).toHaveBeenCalledOnce();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

        expect(mockDb.limit).toHaveBeenCalledExactlyOnceWith(1);
        expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);
    });

    it("[getSchedulesForAnalytics] Should call database", async () => {
        await repository.getSchedulesForAnalytics("2023/2024", 1);

        expect(
            mockDb.query.courseSections.findMany
        ).toHaveBeenCalledExactlyOnceWith({
            columns: { section: true },
            with: {
                course: { columns: { code: true, name: true } },
                schedules: {
                    columns: {
                        day: true,
                        time: true,
                    },
                    with: {
                        venue: { columns: { shortName: true } },
                    },
                },
            },
            where: and(
                eq(courseSections.session, "2023/2024"),
                eq(courseSections.semester, 1)
            ),
        });
    });
});

describe("CourseRepository (integration)", () => {
    let repository: CourseRepository;

    beforeEach(() => {
        const container = setupTestContainer();

        repository = container.resolve(dependencyTokens.courseRepository);
    });

    afterEach(resetDb);

    describe("getByCode", () => {
        it("Should return null if course does not exist", async () => {
            const course = await repository.getByCode("CS101");

            expect(course).toBeNull();
        });

        it("Should return course if it exists", async () => {
            const course = await seedCourse({
                code: "SECJ1013",
                name: "Programming Technique 1",
                credits: 3,
            });

            const fetchedCourse = await repository.getByCode("SECJ1013");

            expect(fetchedCourse).toEqual(course);
        });
    });
});
