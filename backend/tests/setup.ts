// Needed for tsyringe to work properly in tests
import "reflect-metadata";
import { beforeEach, vi } from "vitest";

// Reset mocks before each test
beforeEach(vi.resetAllMocks.bind(vi));
