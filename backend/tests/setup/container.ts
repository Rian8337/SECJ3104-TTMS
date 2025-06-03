import { registerDependencies } from "@/dependencies/register";
import { DependencyContainer, container as globalContainer } from "tsyringe";
import { resetDb } from "./db";

/**
 * Creates a new child DI container for testing purposes.
 *
 * This function registers real implementations by default. Use the {@link overrides} parameter
 * to provide a function that modifies the container.
 *
 * @param overrides A function that receives the container and can modify it.
 * @returns A new child DI container with the registered dependencies.
 */
export function createTestContainer(
    overrides?: (container: DependencyContainer) => void
): DependencyContainer {
    const container = globalContainer.createChildContainer();

    registerDependencies(container);
    overrides?.(container);

    return container;
}

/**
 * Creates and setups a new child DI container for testing purposes.
 *
 * This function registers real implementations by default. Use the {@link overrides}
 * parameter to provide a function that modifies the container. It also setups lifecycle hooks
 * that are commonly used in integration tests.
 *
 * If you only want to create the container without resetting the database, use
 * {@link createTestContainer} instead.
 *
 * This function sets up the following lifecycle hooks:
 * - An {@link afterEach} to reset the database via {@link resetDb} after each test.
 *
 * @param overrides A function that receives the container and can modify it.
 * @returns A new test DI container with the registered dependencies.
 */
export function setupTestContainer(
    overrides?: (container: DependencyContainer) => void
): DependencyContainer {
    const container = createTestContainer(overrides);

    afterEach(resetDb);

    return container;
}
