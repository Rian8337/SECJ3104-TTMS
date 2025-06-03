import { vi } from "vitest";
import {
    ICourseRepository,
    ILecturerRepository,
    ISessionRepository,
    IStudentRepository,
    IVenueRepository,
} from "../../src/repositories";
import { Mocked } from "./Mocked";

/**
 * Mock implementation of {@link ICourseRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockCourseRepository: Mocked<ICourseRepository> = {
    getByCode: vi.fn(),
    getSchedulesForAnalytics: vi.fn(),
};

/**
 * Mock implementation of {@link ILecturerRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockLecturerRepository: Mocked<ILecturerRepository> = {
    getByWorkerNo: vi.fn(),
    getTimetable: vi.fn(),
    searchByName: vi.fn(),
};

/**
 * Mock implementation of {@link ISessionRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockSessionRepository: Mocked<ISessionRepository> = {
    getSessions: vi.fn(),
};

/**
 * Mock implementation of {@link IStudentRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockStudentRepository: Mocked<IStudentRepository> = {
    getByMatricNo: vi.fn(),
    getTimetable: vi.fn(),
    searchByMatricNo: vi.fn(),
    searchByName: vi.fn(),
    getRegisteredStudents: vi.fn(),
};

/**
 * Mock implementation of {@link IVenueRepository}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockVenueRepository: Mocked<IVenueRepository> = {
    getByCode: vi.fn(),
    getVenueClashes: vi.fn(),
};
