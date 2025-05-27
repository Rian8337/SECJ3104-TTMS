import { ILecturer, IStudent } from "@/database/schema";
import { Request, Response } from "express";

/**
 * A controller that is responsible for handling authentication-related operations.
 */
export interface IAuthController {
    /**
     * Logs a user into the system.
     *
     * @param req The request object.
     * @param res The response object.
     */
    login(
        req: Request<
            "/login",
            IStudent | ILecturer | { error: string },
            Partial<{ login: string; password: string }>
        >,
        res: Response<IStudent | ILecturer | { error: string }>
    ): Promise<void>;

    /**
     * Logs a user out of the system.
     *
     * @param req The request object.
     * @param res The response object.
     */
    logout(req: Request<"/logout">, res: Response): void;
}
