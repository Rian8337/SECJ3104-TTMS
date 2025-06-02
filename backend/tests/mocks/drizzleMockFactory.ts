import { vi } from "vitest";

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

export function createMockDb() {
    const builder = {
        select: vi.fn(),
        selectDistinct: vi.fn(),
        limit: vi.fn(),
        from: vi.fn(),
        where: vi.fn(),
        offset: vi.fn(),
        innerJoin: vi.fn(),
        leftJoin: vi.fn(),
        rightJoin: vi.fn(),
        orderBy: vi.fn(),
        as: vi.fn(),
        execute: vi.fn(),
    } satisfies Record<string, ReturnType<typeof vi.fn>>;

    for (const key of Object.keys(builder)) {
        (builder[key] as ReturnType<typeof vi.fn>).mockImplementation(
            () => builder
        );
    }

    return {
        ...builder,
        query: {
            courses: createQueryMock(),
            courseSectionSchedules: createQueryMock(),
            students: createQueryMock(),
            venues: createQueryMock(),
            lecturers: createQueryMock(),
            studentRegisteredCourses: createQueryMock(),
            courseSections: createQueryMock(),
            sessions: createQueryMock(),
        },
    };
}
