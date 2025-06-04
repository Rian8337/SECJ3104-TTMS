import { UserRole } from "@/types";
import { RequestHandler, Response } from "express";
import { IService } from "./IService";
import { OperationResult } from "./OperationResult";

/**
 * A service that is responsible for handling authentication-related operations.
 */
export interface IAuthService extends IService {
    /**
     * Logs a user into the system.
     *
     * @param login The login of the user.
     * @param password The password of the user.
     * @returns A promise that resolves to an operation result containing the user data or an error.
     */
    login(login: string, password: string): Promise<OperationResult>;

    /**
     * Creates a session for a user.
     *
     * The session is signed and encrypted using the secret key.
     *
     * @param res The response object.
     * @param data The data to be stored in the session.
     * @throws {Error} If the session cannot be created.
     */
    createSession(res: Response, data: unknown): void;

    /**
     * Destroys the session of a user.
     *
     * @param res The response object.
     */
    clearSession(res: Response): void;

    /**
     * Creates a middleware that verifies the session of a user.
     *
     * @param allowedRoles The roles that are allowed to access the route. If empty, any authenticated role is allowed.
     * @returns A middleware function that verifies the session of a user.
     */
    verifySession(
        ...allowedRoles: UserRole[]
    ): RequestHandler<unknown, { error: string }>;
}
