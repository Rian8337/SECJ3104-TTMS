import { RequestHandler, Router } from "express";
import { controllerRegistry } from "./controllers";
import { RouteDefinition } from "./decorators/routes";
import { container } from "tsyringe";

/**
 * Creates the router for the application.
 */
export function createRouter(): Router {
    const router = Router();
    const controllers = controllerRegistry.getControllers();

    for (const ControllerClass of controllers) {
        const basePath = Reflect.getMetadata("basePath", ControllerClass) as
            | string
            | undefined;

        if (!basePath) {
            throw new Error(
                `Controller ${ControllerClass.name} does not have a base path defined. It may not have been decorated with @Controller.`
            );
        }

        const controllerMiddlewares =
            (Reflect.getMetadata("controller:middlewares", ControllerClass) as
                | RequestHandler[]
                | undefined) ?? [];

        const routes =
            (Reflect.getMetadata("routes", ControllerClass) as
                | RouteDefinition[]
                | undefined) ?? [];

        const instance = container.resolve(ControllerClass) as Record<
            string,
            RequestHandler
        >;

        for (const route of routes) {
            const routeMiddlewares =
                (Reflect.getMetadata(
                    "route:middlewares",
                    ControllerClass,
                    route.handlerName
                ) as RequestHandler[] | undefined) ?? [];

            const fullPath = `${basePath}${route.path}`;

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
