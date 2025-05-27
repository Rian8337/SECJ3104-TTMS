import { vi } from "vitest";
import { db } from "../../src/database";

interface QueryMock {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
}

function createQueryMock(): QueryMock {
    return {
        findFirst: vi.fn(),
        findMany: vi.fn(),
    };
}

/**
 * Mock database functions for testing purposes.
 */
export const mockDb = {
    select: vi.fn(),
    limit: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    offset: vi.fn(),
    execute: vi.fn(),
    query: {
        courses: createQueryMock(),
        courseSectionSchedules: createQueryMock(),
        students: createQueryMock(),
        venues: createQueryMock(),
        lecturers: createQueryMock(),
        studentRegisteredCourses: createQueryMock(),
        courseSections: createQueryMock(),
        sessions: createQueryMock(),
    } satisfies Readonly<Record<keyof typeof db.query, QueryMock>>,
} as const;
