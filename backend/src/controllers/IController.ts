import { OperationResult } from "@/services";
import { TTMSSemester, TTMSSession } from "@/types";
import { Request, Response } from "express";

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

    /**
     * Validates the session and semester from the request parameters.
     *
     * @param req The Express request object containing the session and semester parameters.
     * @param res The Express response object to send an error response if validation fails.
     * @returns An object containing the validated session and semester if validation is successful;
     * otherwise, returns null.
     */
    validateSessionSemester(
        req: Request<
            unknown,
            { error: string },
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: Response<{ error: string }>
    ): {
        session: TTMSSession;
        semester: TTMSSemester;
    } | null;
}
