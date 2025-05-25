import { container } from "tsyringe";
import { UserRole } from "@/types";
import { UseMiddleware } from "./middleware";
import { IAuthService } from "@/services";
import { dependencyTokens } from "@/dependencies/tokens";
import { RequestHandler } from "express";

/**
 * Marks a method as requiring authentication and authorization.
 *
 * @param roles The roles that are allowed to access the route. If empty, any authenticated role is allowed.
 * @returns A method decorator that applies authentication and authorization middleware.
 */
export function Roles(...roles: UserRole[]): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        const middleware: RequestHandler<unknown, { error: string }> = async (
            req,
            res,
            next
        ) => {
            // IMPORTANT: The service resolution is deferred to here to make sure that it has been registered.
            const authService = container.resolve<IAuthService>(
                dependencyTokens.authService
            );

            await authService.verifySession(...roles)(req, res, next);
        };

        UseMiddleware(middleware)(target, propertyKey, descriptor);
    };
}
