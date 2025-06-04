import { createApp } from "@/app";
import { registerDependencies } from "@/dependencies/register";

registerDependencies();

/**
 * The Express application instance for testing.
 */
export const app = createApp();
