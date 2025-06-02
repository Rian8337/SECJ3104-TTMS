import { config } from "dotenv";
// Needed for tsyringe to work properly in tests
import "reflect-metadata";
import { beforeEach, vi } from "vitest";

config({ path: ".env.test" });

// Reset mocks before each test
beforeEach(vi.resetAllMocks.bind(vi));
