import { Controller } from "@/decorators/controller";
import { createMockClassDecoratorTestTarget } from "@test/mocks";

describe("@Controller decorator (unit)", () => {
    afterEach(() => {
        // Clear the metadata after each test to avoid interference
        const controllers = Reflect.getMetadata(
            "controllers",
            globalThis
        ) as unknown[];

        controllers.pop();
    });

    it("Adds controller metadata with the default path", () => {
        const t = createMockClassDecoratorTestTarget(Controller);

        const basePath = Reflect.getMetadata("basePath", t) as string;

        expect(basePath).toBeDefined();
        expect(basePath).toBe("");

        const controllers = Reflect.getMetadata(
            "controllers",
            globalThis
        ) as unknown[];

        expect(controllers).toBeDefined();
        expect(Array.isArray(controllers)).toBe(true);
        expect(controllers).toContain(t);
    });

    it("Adds controller metadata with a custom path", () => {
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
