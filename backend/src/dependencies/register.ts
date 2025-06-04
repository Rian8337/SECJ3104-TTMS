import { db } from "@/database";
import { InjectionToken } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";
// Ensure repositories and services are loaded and metadata is registered
import "../repositories";
import "../services";
import { getContainer } from "./container";
import { dependencyTokens } from "./tokens";

/**
 * Registers all repositories and services to a DI container.
 *
 * @param container The DI container to register the dependencies to.
 * If not provided, the container from {@link getContainer} will be used.
 */
export function registerDependencies(container = getContainer()) {
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
