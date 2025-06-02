import { container as globalContainer, DependencyContainer } from "tsyringe";
import { registerDependencies } from "../../src/dependencies/register";

/**
 * Creates a new child DI container for testing purposes.
 *
 * This function registers real implementations by default. Use the {@link overrides} parameter
 * to provide a function that modifies the container.
 *
 * @param overrides A function that receives the container and can modify it.
 * @returns A new child DI container with the registered dependencies.
 */
export function setupTestContainer(
    overrides?: (container: DependencyContainer) => void
): DependencyContainer {
    const container = globalContainer.createChildContainer();

    registerDependencies(container);
    overrides?.(container);

    return container;
}
