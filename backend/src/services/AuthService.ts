import { ILecturer, isLecturer, isStudent, IStudent } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { ILecturerRepository, IStudentRepository } from "@/repositories";
import { UserRole } from "@/types";
import {
    decrypt,
    encrypt,
    isValidKpNo,
    isValidMatricNumber,
    isValidWorkerNo,
} from "@/utils";
import { RequestHandler, Response } from "express";
import { inject } from "tsyringe";
import { BaseService } from "./BaseService";
import { IAuthService } from "./IAuthService";
import { OperationResult } from "./OperationResult";

/**
 * A service that is responsible for handling authentication-related operations.
 */
@Service(dependencyTokens.authService)
export class AuthService extends BaseService implements IAuthService {
    private readonly sessionCookieName = "session";

    constructor(
        @inject(dependencyTokens.studentRepository)
        private readonly studentRepository: IStudentRepository,
        @inject(dependencyTokens.lecturerRepository)
        private readonly lecturerRepository: ILecturerRepository
    ) {
        super();
    }

    login(login: string, password: string): Promise<OperationResult> {
        if (isValidMatricNumber(login)) {
            return this.loginStudent(login, password);
        }

        if (isValidWorkerNo(login)) {
            return this.loginLecturer(login, password);
        }

        return Promise.resolve(
            this.createFailedResponse("Invalid username or password.", 401)
        );
    }

    createSession(res: Response, data: unknown) {
        const encrypted = encrypt(JSON.stringify(data));

        res.cookie(this.sessionCookieName, encrypted, {
            httpOnly: true,
            signed: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60, // 1 hour
        });
    }

    clearSession(res: Response) {
        res.clearCookie(this.sessionCookieName);
    }

    verifySession(
        ...allowedRoles: UserRole[]
    ): RequestHandler<unknown, { error: string }> {
        return (req, res, next) => {
            const encrypted = (
                req.signedCookies as Record<string, string | undefined>
            )[this.sessionCookieName];

            if (!encrypted) {
                res.status(401).json({ error: "Unauthorized" });

                return;
            }

            try {
                const decrypted = decrypt(encrypted);
                const session = JSON.parse(decrypted) as unknown;
                let role: UserRole;

                switch (true) {
                    case isStudent(session):
                        role = UserRole.student;
                        req.student = session;
                        break;

                    case isLecturer(session):
                        role = UserRole.lecturer;
                        req.lecturer = session;
                        break;

                    default:
                        res.status(401).json({ error: "Unauthorized" });

                        return;
                }

                if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
                    res.status(403).json({ error: "Forbidden" });

                    return;
                }

                next();
            } catch {
                this.clearSession(res);
                res.status(401).json({ error: "Unauthorized" });
            }
        };
    }

    private async loginStudent(
        login: string,
        password: string
    ): Promise<OperationResult<IStudent>> {
        if (!isValidKpNo(password)) {
            return this.createFailedResponse(
                "Invalid username or password.",
                401
            );
        }

        const student = await this.studentRepository.getByMatricNo(login);

        if (student?.kpNo !== password) {
            return this.createFailedResponse(
                "Invalid username or password.",
                401
            );
        }

        return this.createSuccessfulResponse(student);
    }

    private async loginLecturer(
        login: string,
        password: string
    ): Promise<OperationResult<ILecturer>> {
        const workerNo = parseInt(login);
        const lecturer = await this.lecturerRepository.getByWorkerNo(workerNo);

        if (lecturer?.workerNo.toString() !== password) {
            return this.createFailedResponse(
                "Invalid username or password.",
                401
            );
        }

        return this.createSuccessfulResponse(lecturer);
    }
}
