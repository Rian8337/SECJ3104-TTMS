import { OperationResult } from "@/services";
import { TTMSSemester, TTMSSession } from "@/types";
import { validateAcademicSession, validateSemester } from "@/utils";
import { Request, Response } from "express";

/**
 * The base class for all controllers.
 */
export abstract class BaseController {
    /**
     * Responds to an HTTP request with the result of an operation.
     *
     * @param res The Express response object to send the result to.
     * @param result The result of the operation.
     */
    protected respondWithOperationResult(
        res: Response,
        result: OperationResult
    ) {
        res.status(result.status);

        if (result.isSuccessful()) {
            res.json(result.data);
        } else if (result.failed()) {
            res.json({ error: result.error });
        }
    }

    /**
     * Validates the session and semester from the request parameters.
     *
     * @param req The Express request object containing the session and semester parameters.
     * @param res The Express response object to send an error response if validation fails.
     * @returns An object containing the validated session and semester if validation is successful;
     * otherwise, returns null.
     */
    protected validateSessionSemester(
        req: Request<
            unknown,
            { error: string },
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: Response<{ error: string }>
    ): { session: TTMSSession; semester: TTMSSemester } | null {
        const { session, semester } = req.query;

        if (!session) {
            res.status(400).json({ error: "Academic session is required." });

            return null;
        }

        if (!semester) {
            res.status(400).json({ error: "Semester is required." });

            return null;
        }

        if (!validateAcademicSession(session)) {
            res.status(400).json({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });

            return null;
        }

        const parsedSemester = parseInt(semester);

        if (!validateSemester(parsedSemester)) {
            res.status(400).json({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });

            return null;
        }

        return { session, semester: parsedSemester };
    }
}
