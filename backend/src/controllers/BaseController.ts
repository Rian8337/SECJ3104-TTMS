import { OperationResult } from "@/services";
import { TTMSSemester, TTMSSession } from "@/types";
import { validateAcademicSession, validateSemester } from "@/utils";
import { Request, Response } from "express";
import { IController } from "./IController";

/**
 * The base class for all controllers.
 */
export abstract class BaseController implements IController {
    respondWithOperationResult(
        res: Response,
        result: OperationResult<unknown>
    ) {
        res.status(result.status);

        if (result.isSuccessful()) {
            res.json(result.data);
        } else if (result.failed()) {
            res.json({ error: result.error });
        }
    }

    validateSessionSemester(
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
