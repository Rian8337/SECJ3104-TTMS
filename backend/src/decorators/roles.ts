import { container } from "tsyringe";
import { UserRole } from "@/types";
import { UseMiddleware } from "./middleware";
import { IAuthService } from "@/services";
import { dependencyTokens } from "@/dependencies/tokens";

/**
 * Marks a method as requiring authentication and authorization.
 *
 * @param roles The roles that are allowed to access the route. If empty, any authenticated role is allowed.
 * @returns A method decorator that applies authentication and authorization middleware.
 */
export function Roles(...roles: UserRole[]): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        const authService = container.resolve<IAuthService>(
            dependencyTokens.authService
        );

        UseMiddleware(authService.verifySession(...roles))(
            target,
            propertyKey,
            descriptor
        );
    };
}
