import { injectable } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";

/**
 * Marks a class as a controller that can handle HTTP requests.
 *
 * @param basePath The base path of the controller. Defaults to an empty string.
 * @returns A class decorator that marks the class as a controller.
 */
export function Controller(basePath = ""): ClassDecorator {
    return (target) => {
        const targetConstructor = target as unknown as constructor<unknown>;
        Reflect.defineMetadata("basePath", basePath, targetConstructor);

        const controllers =
            (Reflect.getMetadata("controllers", globalThis) as
                | constructor<unknown>[]
                | undefined) ?? [];

        Reflect.defineMetadata(
            "controllers",
            controllers.concat(targetConstructor),
            globalThis
        );

        injectable()(targetConstructor);
    };
}
