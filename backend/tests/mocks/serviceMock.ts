import { vi } from "vitest";
import {
    IAuthService,
    ILecturerService,
    IStudentService,
    IVenueService,
} from "../../src/services";
import { dependencyTokens } from "../../src/dependencies/tokens";
import { Mocked } from "./Mocked";
import { container } from "tsyringe";

/**
 * Mock implementation of {@link IAuthService}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockAuthService: Mocked<IAuthService> = {
    login: vi.fn(),
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
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockLecturerService: Mocked<ILecturerService> = {
    createFailedResponse: vi.fn(),
    createSuccessfulResponse: vi.fn(),
    getByWorkerNo: vi.fn(),
    getTimetable: vi.fn(),
    getVenueClashes: vi.fn(),
    search: vi.fn(),
};

/**
 * Mock implementation of {@link IStudentService}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
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
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockVenueService: Mocked<IVenueService> = {
    createFailedResponse: vi.fn(),
    createSuccessfulResponse: vi.fn(),
    getByCode: vi.fn(),
};

container.registerInstance(dependencyTokens.authService, mockAuthService);

container.registerInstance(
    dependencyTokens.lecturerService,
    mockLecturerService
);

container.registerInstance(dependencyTokens.studentService, mockStudentService);

container.registerInstance(dependencyTokens.venueService, mockVenueService);
