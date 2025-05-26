import { vi } from "vitest";
import {
    FailedOperationResult,
    SuccessfulOperationResult,
} from "../../src/services";

/**
 * Creates a {@link SuccessfulOperationResult} whose methods have been mocked.
 *
 * @param data The data to be included in the {@link SuccessfulOperationResult}.
 * @param status The HTTP status code to be included in the {@link SuccessfulOperationResult}. Defaults to 200.
 * @return A mock of {@link SuccessfulOperationResult} containing the provided data.
 */
export function createSuccessfulOperationResultMock<T>(
    data: T,
    status = 200
): SuccessfulOperationResult<T> {
    return {
        isSuccessful: vi.fn<SuccessfulOperationResult<T>["isSuccessful"]>(
            (() => true) as SuccessfulOperationResult<T>["isSuccessful"]
        ),
        failed: vi.fn<SuccessfulOperationResult<T>["failed"]>(
            (() => false) as SuccessfulOperationResult<T>["failed"]
        ),
        status,
        data,
    } as unknown as SuccessfulOperationResult<T>;
}

/**
 * Creates a {@link FailedOperationResult} whose methods have been mocked.
 *
 * @param error The error message to be included in the {@link FailedOperationResult}.
 * @param status The HTTP status code to be included in the {@link FailedOperationResult}. Defaults to 400.
 * @returns A mock of {@link FailedOperationResult} containing the provided error message.
 */
export function createFailedOperationResultMock(
    error: string,
    status = 400
): FailedOperationResult {
    return {
        isSuccessful: vi.fn<FailedOperationResult["isSuccessful"]>(
            (() => false) as FailedOperationResult["isSuccessful"]
        ),
        failed: vi.fn<FailedOperationResult["failed"]>(
            (() => true) as FailedOperationResult["failed"]
        ),
        status,
        error,
    } as unknown as FailedOperationResult;
}
