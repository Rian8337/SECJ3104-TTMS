import { RequestHandler, Router } from "express";
import { RouteDefinition } from "./decorators/routes";
import { container } from "tsyringe";

/**
 * Creates the router for the application.
 */
export function createRouter(): Router {
    const router = Router();

    const controllers =
        (Reflect.getMetadata("controllers", globalThis) as
            | (new () => Record<string, RequestHandler>)[]
            | undefined) ?? [];

    for (const ControllerClass of controllers) {
        const basePath = Reflect.getMetadata("basePath", ControllerClass) as
            | string
            | undefined;

        if (!basePath) {
            throw new Error(
                `Controller ${ControllerClass.name} does not have a base path defined. It may not have been decorated with @Controller.`
            );
        }

        const routes =
            (Reflect.getMetadata("routes", ControllerClass) as
                | RouteDefinition[]
                | undefined) ?? [];

        if (routes.length === 0) {
            // Skip controllers without routes
            continue;
        }

        const controllerMiddlewares =
            (Reflect.getMetadata("controller:middlewares", ControllerClass) as
                | RequestHandler[]
                | undefined) ?? [];

        if (!container.isRegistered(ControllerClass)) {
            container.registerSingleton(ControllerClass);
        }

        const instance = container.resolve(ControllerClass);

        for (const route of routes) {
            const routeMiddlewares =
                (Reflect.getMetadata(
                    "route:middlewares",
                    ControllerClass.prototype as object,
                    route.handlerName
                ) as RequestHandler[] | undefined) ?? [];

            const fullPath = `${basePath}${route.path}`;

            console.log(fullPath, routeMiddlewares);

            router[route.method](
                fullPath,
                ...controllerMiddlewares,
                ...routeMiddlewares,
                instance[route.handlerName].bind(instance)
            );
        }
    }

    return router;
}
