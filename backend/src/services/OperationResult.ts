/**
 * Represents the result of an operation within a {@link Service}.
 *
 * @template T The type of the data.
 */
export interface OperationResult<T = unknown> {
    /**
     * The HTTP status code of the operation.
     */
    readonly status: number;

    /**
     * Whether the operation was successful.
     */
    isSuccessful(): this is SuccessfulOperationResult<T>;

    /**
     * Whether the operation failed.
     */
    failed(): this is FailedOperationResult;
}

/**
 * Represents a successful operation result.
 *
 * @template T The type of the data.
 */
export interface SuccessfulOperationResult<T> extends OperationResult<T> {
    /**
     * The data of the operation.
     */
    readonly data: T;
}

/**
 * Represents a failed operation result.
 *
 * @template T The type of the data.
 */
export interface FailedOperationResult extends OperationResult<never> {
    /**
     * The error message of the operation.
     */
    readonly error: string;
}
