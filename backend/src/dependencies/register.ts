// Ensure repositories and services are loaded and metadata is registered
import "../repositories";
import "../services";
import { container as globalContainer, InjectionToken } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";
import { dependencyTokens } from "./tokens";
import { db } from "@/database";

/**
 * Registers all repositories and services to a DI container.
 *
 * @param container The DI container to register the dependencies to.
 * If not provided, the global container will be used.
 */
export function registerDependencies(container = globalContainer) {
    container.registerInstance(dependencyTokens.drizzleDb, db);

    const classes = [
        ...((Reflect.getMetadata("repositories", globalThis) as
            | constructor<unknown>[]
            | undefined) ?? []),
        ...((Reflect.getMetadata("services", globalThis) as
            | constructor<unknown>[]
            | undefined) ?? []),
    ];

    for (const cls of classes) {
        const token = Reflect.getMetadata("registrationToken", cls) as
            | InjectionToken<unknown>
            | undefined;

        if (!token) {
            throw new Error(
                `Class ${cls.name} is missing a registration token. Please use the @Service or @Repository decorator.`
            );
        }

        container.register(token, { useClass: cls });
    }
}
