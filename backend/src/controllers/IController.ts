import { OperationResult } from "@/services";
import { Response } from "express";

/**
 * Represents a controller that handles HTTP requests and provides a method to respond with operation results.
 */
export interface IController {
    /**
     * Responds to an HTTP request with the result of an operation.
     *
     * @param res The Express response object to send the result to.
     * @param result The result of the operation.
     */
    respondWithOperationResult(
        res: Response,
        result: OperationResult<unknown>
    ): void;
}
