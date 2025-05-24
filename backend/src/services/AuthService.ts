import { isLecturer, isStudent } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { UserRole } from "@/types";
import { decrypt, encrypt } from "@/utils";
import { RequestHandler, Response } from "express";
import { BaseService } from "./BaseService";
import { IAuthService } from "./IAuthService";

/**
 * A service that is responsible for handling authentication-related operations.
 */
@Service(dependencyTokens.authService)
export class AuthService extends BaseService implements IAuthService {
    private readonly sessionCookieName = "session";

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
}
