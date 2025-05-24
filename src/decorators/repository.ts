import { container, injectable, InjectionToken } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";

/**
 * Marks a class as a repository that can be injected into other classes.
 *
 * The class will be registered in the global dependency injection container as a singleton.
 *
 * @param token The injection token for the repository.
 * @returns A class decorator that marks the class as a repository.
 */
export function Repository(token: InjectionToken): ClassDecorator {
    return (target) => {
        const targetConstructor = target as unknown as constructor<unknown>;

        injectable()(targetConstructor);

        container.registerSingleton(token, targetConstructor);
    };
}
