import { container } from "tsyringe";
import { Mock, vi } from "vitest";
import { dependencyTokens } from "../../src/dependencies/tokens";
import {
    ICourseRepository,
    ILecturerRepository,
    ISessionRepository,
    IStudentRepository,
    IVenueRepository,
} from "../../src/repositories";
import {
    IAuthService,
    ILecturerService,
    IStudentService,
    IVenueService,
} from "../../src/services";

/**
 * Utility type to create a mock of a given type T.
 */
type Mocked<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [P in keyof T]: T[P] extends (...args: any[]) => any
        ? Mock<T[P]>
        : T[P] extends object
          ? Mocked<T[P]>
          : T[P];
};

//#region Mocked Repositories

/**
 * Mock implementation of {@link ICourseRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockCourseRepository: Mocked<ICourseRepository> = {
    getCourseByCode: vi.fn(),
};

/**
 * Mock implementation of {@link ILecturerRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockLecturerRepository: Mocked<ILecturerRepository> = {
    getByWorkerNo: vi.fn(),
    getClashingTimetable: vi.fn(),
    getTimetable: vi.fn(),
    searchByName: vi.fn(),
};

/**
 * Mock implementation of {@link ISessionRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockSessionRepository: Mocked<ISessionRepository> = {
    getSessions: vi.fn(),
};

/**
 * Mock implementation of {@link IStudentRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockStudentRepository: Mocked<IStudentRepository> = {
    getByMatricNo: vi.fn(),
    getTimetable: vi.fn(),
    searchByMatricNo: vi.fn(),
    searchByName: vi.fn(),
};

/**
 * Mock implementation of {@link IVenueRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockVenueRepository: Mocked<IVenueRepository> = {
    getByCode: vi.fn(),
};

//#endregion

//#region Mocked Services

/**
 * Mock implementation of {@link IAuthService}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockAuthService: Mocked<IAuthService> = {
    createFailedResponse: vi.fn(),
    createSuccessfulResponse: vi.fn(),
    clearSession: vi.fn(),
    createSession: vi.fn(),
    verifySession: vi.fn(),
};

/**
 * Mock implementation of {@link ILecturerService}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockLecturerService: Mocked<ILecturerService> = {
    createFailedResponse: vi.fn(),
    createSuccessfulResponse: vi.fn(),
    getByWorkerNo: vi.fn(),
    getTimetable: vi.fn(),
    getClashingTimetable: vi.fn(),
};

/**
 * Mock implementation of {@link IStudentService}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockStudentService: Mocked<IStudentService> = {
    createFailedResponse: vi.fn(),
    createSuccessfulResponse: vi.fn(),
    getByMatricNo: vi.fn(),
    getTimetable: vi.fn(),
    search: vi.fn(),
};

/**
 * Mock implementation of {@link IVenueService}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed.
 *
 * **This mock is registered in the global DI container via {@link createMockContainer},
 * so make sure to reset it after each test if you want to ensure a clean state**.
 */
export const mockVenueService: Mocked<IVenueService> = {
    createFailedResponse: vi.fn(),
    createSuccessfulResponse: vi.fn(),
    getByCode: vi.fn(),
};

//#endregion

//#region DI Container Setup

/**
 * Registers mock services and repositories to the global DI container for testing purposes.
 *
 * The mocks are empty implementations that can be overridden in individual tests by resolving
 * them from the container and providing specific behavior as needed.
 *
 * **It is important to reset the mocks after each test using `vi.resetAllMocks()` to ensure a clean state.**
 */
export function createMockContainer() {
    container.registerInstance(
        dependencyTokens.courseRepository,
        mockCourseRepository
    );

    container.registerInstance(
        dependencyTokens.lecturerRepository,
        mockLecturerRepository
    );

    container.registerInstance(
        dependencyTokens.sessionRepository,
        mockSessionRepository
    );

    container.registerInstance(
        dependencyTokens.studentRepository,
        mockStudentRepository
    );

    container.registerInstance(
        dependencyTokens.venueRepository,
        mockVenueRepository
    );

    container.registerInstance(dependencyTokens.authService, mockAuthService);

    container.registerInstance(
        dependencyTokens.lecturerService,
        mockLecturerService
    );

    container.registerInstance(
        dependencyTokens.studentService,
        mockStudentService
    );

    container.registerInstance(dependencyTokens.venueService, mockVenueService);
}

//#endregion
