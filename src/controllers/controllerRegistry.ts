import { constructor } from "tsyringe/dist/typings/types";

const controllers: constructor<unknown>[] = [];

/**
 * Manages the registration of controllers.
 */
export const controllerRegistry = {
    /**
     * Adds a controller to the registry.
     *
     * @param controller The controller class to register.
     */
    registerController(controller: constructor<unknown>) {
        controllers.push(controller);
    },

    /**
     * Gets the list of registered controllers.
     *
     * @returns The list of registered controllers.
     */
    getControllers(): constructor<unknown>[] {
        return controllers;
    },
};
