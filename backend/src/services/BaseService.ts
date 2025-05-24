import { IService } from "./IService";
import {
    FailedOperationResult,
    SuccessfulOperationResult,
} from "./OperationResult";

/**
 * The base class for all services.
 */
export abstract class BaseService implements IService {
    createSuccessfulResponse<T>(
        data: T,
        status = 200
    ): SuccessfulOperationResult<T> {
        return {
            status,
            data,
            isSuccessful: (): this is SuccessfulOperationResult<T> => true,
            failed: (): this is FailedOperationResult => false,
        };
    }

    createFailedResponse(error: string, status = 400): FailedOperationResult {
        return {
            status,
            error,
            isSuccessful: (): this is SuccessfulOperationResult<never> => false,
            failed: (): this is FailedOperationResult => true,
        };
    }
}
