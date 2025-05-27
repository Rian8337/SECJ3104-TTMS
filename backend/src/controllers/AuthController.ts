import { Controller } from "@/decorators/controller";
import { BaseController } from "./BaseController";
import { IAuthController } from "./IAuthController";
import { IStudent, ILecturer } from "@/database/schema";
import { Request, Response } from "express";
import { Post } from "@/decorators/routes";
import { inject } from "tsyringe";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAuthService } from "@/services";
import { Roles } from "@/decorators/roles";

/**
 * A controller that is responsible for handling authentication-related operations.
 */
@Controller("/auth")
export class AuthController extends BaseController implements IAuthController {
    constructor(
        @inject(dependencyTokens.authService)
        private readonly authService: IAuthService
    ) {
        super();
    }

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

    @Post("/logout")
    @Roles()
    logout(_: Request<"/logout">, res: Response) {
        this.authService.clearSession(res);

        res.sendStatus(200);
    }
}
