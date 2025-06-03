import { DrizzleDb } from "@/database";
import { courses, courseSections } from "@/database/schema";
import { dependencyTokens } from "@/dependencies/tokens";
import { CourseRepository } from "@/repositories";
import { and, eq } from "drizzle-orm";
import { createMockDb } from "../mocks";
import { createTestContainer } from "../setup/container";
import { seededPrimaryData } from "../setup/db";

describe("CourseRepository (unit)", () => {
    let repository: CourseRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new CourseRepository(mockDb as unknown as DrizzleDb);
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
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.courseRepository);

    describe("getByCode", () => {
        it("Should return null if course does not exist", async () => {
            const course = await repository.getByCode("CS101");

            expect(course).toBeNull();
        });

        it("Should return course if it exists", async () => {
            const fetchedCourse = await repository.getByCode("SECJ1013");

            expect(fetchedCourse).toEqual(seededPrimaryData.courses[0]);
        });
    });
});
