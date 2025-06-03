import {
    IAnalyticsService,
    IAuthService,
    ILecturerService,
    IStudentService,
    IVenueService,
} from "@/services";
import { Mocked } from "./Mocked";

/**
 * Mock implementation of {@link IAnalyticsService}.
 *
 * This mock contains empty implementations that can be overridden in individual tests to
 * provide specific behavior as needed. It is reset via {@link vi.resetAllMocks} before
 * each test to ensure a clean state.
 */
export const mockAnalyticsService: Mocked<IAnalyticsService> = {
    createFailedResponse: vi.fn(),
    createSuccessfulResponse: vi.fn(),
    generate: vi.fn(),
};

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
