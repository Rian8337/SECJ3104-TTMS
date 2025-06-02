import "reflect-metadata";
import { dependencyTokens } from "@/dependencies/tokens";
import { container as globalContainer } from "tsyringe";
import { db } from ".";

/**
 * Registers the Drizzle database instance to the a DI container.
 *
 * This will only be done if the token is not already registered in the container.
 *
 * @param container The DI container to register the database instance to.
 * If not provided, the global container will be used.
 */
export function registerDatabase(container = globalContainer) {
    if (!container.isRegistered(dependencyTokens.drizzleDb)) {
        container.registerInstance(dependencyTokens.drizzleDb, db);
    }
}
