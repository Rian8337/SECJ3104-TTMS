import { injectable, InjectionToken } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";

/**
 * Marks a class as a service that can be injected into other classes.
 *
 * The class will be registered in the global dependency injection container as a singleton.
 *
 * @param token The injection token for the service.
 * @returns A class decorator that marks the class as a service.
 */
export function Service(token: InjectionToken): ClassDecorator {
    return (target) => {
        const targetConstructor = target as unknown as constructor<unknown>;

        injectable()(targetConstructor);

        Reflect.defineMetadata("registrationToken", token, target);
    };
}
