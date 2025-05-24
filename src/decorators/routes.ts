enum HttpMethod {
    get = "get",
    post = "post",
    put = "put",
    delete = "delete",
}

/**
 * Represents a route definition.
 */
export interface RouteDefinition {
    /**
     * The path of the route.
     */
    readonly path: string;

    /**
     * The HTTP method of the route.
     */
    readonly method: HttpMethod;

    /**
     * The name of the handler method.
     */
    readonly handlerName: string;
}

function createRouteDecorator(method: HttpMethod) {
    return (path: string): MethodDecorator => {
        return (target, propertyKey) => {
            const routes: RouteDefinition[] =
                (Reflect.getMetadata("routes", target.constructor) as
                    | RouteDefinition[]
                    | undefined) ?? [];

            routes.push({
                path,
                method,
                handlerName: propertyKey.toString(),
            });

            Reflect.defineMetadata("routes", routes, target.constructor);
        };
    };
}

/**
 * Marks a method as a route handler for a GET request.
 *
 * @param path The path of the route.
 * @returns A method decorator that registers the route.
 */
export const Get = createRouteDecorator(HttpMethod.get);

/**
 * Marks a method as a route handler for a POST request.
 *
 * @param path The path of the route.
 * @returns A method decorator that registers the route.
 */
export const Post = createRouteDecorator(HttpMethod.post);

/**
 * Marks a method as a route handler for a PUT request.
 *
 * @param path The path of the route.
 * @returns A method decorator that registers the route.
 */
export const Put = createRouteDecorator(HttpMethod.put);

/**
 * Marks a method as a route handler for a DELETE request.
 *
 * @param path The path of the route.
 * @return A method decorator that registers the route.
 */
export const Delete = createRouteDecorator(HttpMethod.delete);
