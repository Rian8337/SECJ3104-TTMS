import { RequestHandler } from "express";

/**
 * Attaches middlewares to a controller or a specific route.
 *
 * @param middlewares The middlewares to attach.
 * @returns A method decorator or class decorator.
 */
export function UseMiddleware(
    ...middlewares: RequestHandler[]
): MethodDecorator & ClassDecorator {
    return (target: object, propertyKey?: string | symbol) => {
        if (propertyKey) {
            // Route-level middleware
            const existing =
                (Reflect.getMetadata(
                    "route:middlewares",
                    target.constructor,
                    propertyKey
                ) as RequestHandler[] | undefined) ?? [];

            Reflect.defineMetadata(
                "route:middlewares",
                existing.concat(middlewares),
                target.constructor,
                propertyKey
            );
        } else {
            // Controller-level middleware
            const existing =
                (Reflect.getMetadata("controller:middlewares", target) as
                    | RequestHandler[]
                    | undefined) ?? [];

            Reflect.defineMetadata(
                "controller:middlewares",
                existing.concat(middlewares),
                target
            );
        }
    };
}
