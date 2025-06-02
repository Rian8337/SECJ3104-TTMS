import { ILecturer, IStudent } from "@/database/schema";
import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAuthService } from "@/services";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * A controller that is responsible for handling authentication-related operations.
 */
@Controller("/auth")
export class AuthController extends BaseController {
    constructor(
        @inject(dependencyTokens.authService)
        private readonly authService: IAuthService
    ) {
        super();
    }

    /**
     * Logs a user into the system.
     *
     * @param req The request object.
     * @param res The response object.
     */
    @Post("/login")
    async login(
        req: Request<
            "/login",
            IStudent | ILecturer | { error: string },
            Partial<{ login: string; password: string }>
        >,
        res: Response<IStudent | ILecturer | { error: string }>
    ) {
        const { login, password } = req.body;

        if (!login || !password) {
            res.status(400).json({ error: "Login and password are required" });

            return;
        }

        try {
            const result = await this.authService.login(login, password);

            if (result.isSuccessful()) {
                this.authService.createSession(res, result.data);
            }

            this.respondWithOperationResult(res, result);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Logs a user out of the system.
     *
     * @param req The request object.
     * @param res The response object.
     */
    @Post("/logout")
    @Roles()
    logout(_: Request<"/logout">, res: Response) {
        this.authService.clearSession(res);

        res.sendStatus(200);
    }
}
