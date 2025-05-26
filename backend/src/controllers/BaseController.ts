import { OperationResult } from "@/services";
import { Response } from "express";
import { IController } from "./IController";

/**
 * The base class for all controllers.
 */
export abstract class BaseController implements IController {
    respondWithOperationResult(
        res: Response,
        result: OperationResult<unknown>
    ): void {
        if (result.isSuccessful()) {
            res.status(result.status).json(result.data);
        } else if (result.failed()) {
            res.status(result.status).json({ error: result.error });
        }
    }
}
