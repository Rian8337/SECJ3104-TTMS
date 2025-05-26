import { describe, expect, it } from "vitest";
import { Controller } from "../../src/decorators/controller";
import { createMockClassDecoratorTestTarget } from "../mocks";

describe("@Controller", () => {
    it("Adds controller metadata", () => {
        const t = createMockClassDecoratorTestTarget(Controller, "/test");

        const basePath = Reflect.getMetadata("basePath", t) as string;

        expect(basePath).toBeDefined();
        expect(basePath).toBe("/test");

        const controllers = Reflect.getMetadata(
            "controllers",
            globalThis
        ) as unknown[];

        expect(controllers).toBeDefined();
        expect(Array.isArray(controllers)).toBe(true);
        expect(controllers).toContain(t);
    });
});
