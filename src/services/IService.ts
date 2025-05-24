import {
    FailedOperationResult,
    SuccessfulOperationResult,
} from "./OperationResult";

/**
 * Represents a service that handles operations and provides utility methods for creating operation results.
 *
 * @template T The type of the data.
 */
export interface IService {
    /**
     * Creates a successful operation result.
     *
     * @param data The data of the operation.
     * @param status The HTTP status code of the operation. Defaults to 200 (OK).
     * @returns The successful operation result.
     */
    createSuccessfulResponse<T>(
        data: T,
        status?: number
    ): SuccessfulOperationResult<T>;

    /**
     * Creates a failed operation result.
     *
     * @param status The HTTP status code of the operation.
     * @param error The error message of the operation. Defaults to 400 (Bad Request).
     * @returns The failed operation result.
     */
    createFailedResponse(error: string, status?: number): FailedOperationResult;
}
