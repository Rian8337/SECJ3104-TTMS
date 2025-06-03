import { container, DependencyContainer } from "tsyringe";

let currentContainer = container;

/**
 * Gets the current dependency injection container.
 */
export function getContainer(): DependencyContainer {
    return currentContainer;
}

/**
 * Sets the current dependency injection container.
 *
 * @param container The dependency injection container to set as the current one.
 */
export function useContainer(container: DependencyContainer) {
    currentContainer = container;
}
