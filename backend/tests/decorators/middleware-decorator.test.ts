import { describe, expect, it } from "vitest";
import {
    createMockClassDecoratorTestTarget,
    createMockMethodDecoratorTestTarget,
} from "../mocks/mockDecoratorTargetFactory";
import { UseMiddleware } from "../../src/decorators/middleware";

describe("@UseMiddleware", () => {
    it("Registers a controller-level middleware with the correct metadata", () => {
        const middlewareFunction = () => {
            // Middleware logic
        };

        const t = createMockClassDecoratorTestTarget(
            UseMiddleware,
            middlewareFunction
        );

        const middlewares = Reflect.getMetadata(
            "controller:middlewares",
            t
        ) as unknown[];

        expect(middlewares).toBeDefined();
        expect(Array.isArray(middlewares)).toBe(true);
        expect(middlewares.length).toBe(1);
        expect(middlewares[0]).toBe(middlewareFunction);
    });

    it("Registers a route-level middleware with the correct metadata", () => {
        const middlewareFunction = () => {
            // Middleware logic
        };

        const t = createMockMethodDecoratorTestTarget(
            UseMiddleware,
            middlewareFunction
        );

        const middlewares = Reflect.getMetadata(
            "route:middlewares",
            t.prototype,
            t.methodName
        ) as unknown[];

        expect(middlewares).toBeDefined();
        expect(Array.isArray(middlewares)).toBe(true);
        expect(middlewares.length).toBe(1);
        expect(middlewares[0]).toBe(middlewareFunction);
    });
});
