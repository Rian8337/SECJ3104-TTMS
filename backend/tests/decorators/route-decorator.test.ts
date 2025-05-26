import { describe, expect, it } from "vitest";
import {
    Delete,
    Get,
    HttpMethod,
    Post,
    Put,
    RouteDefinition,
} from "../../src/decorators/routes";
import { createMockMethodDecoratorTestTarget } from "../mocks/mockDecoratorTargetFactory";

describe("@Get", () => {
    it("Registers the route with the correct metadata", () => {
        const path = "/test";
        const t = createMockMethodDecoratorTestTarget(Get, path);

        const routes = Reflect.getMetadata(
            "routes",
            t.prototype.constructor
        ) as RouteDefinition[];

        expect(routes).toBeDefined();
        expect(Array.isArray(routes)).toBe(true);
        expect(routes.length).toBe(1);

        const route = routes[0];

        expect(route.path).toBe(path);
        expect(route.method).toBe(HttpMethod.get);
        expect(route.handlerName).toBe(t.methodName);
    });
});

describe("@Post", () => {
    it("Registers the route with the correct metadata", () => {
        const path = "/test";
        const t = createMockMethodDecoratorTestTarget(Post, path);

        const routes = Reflect.getMetadata(
            "routes",
            t.prototype.constructor
        ) as RouteDefinition[];

        expect(routes).toBeDefined();
        expect(Array.isArray(routes)).toBe(true);
        expect(routes.length).toBe(1);

        const route = routes[0];

        expect(route.path).toBe(path);
        expect(route.method).toBe(HttpMethod.post);
        expect(route.handlerName).toBe(t.methodName);
    });
});

describe("@Put", () => {
    it("Registers the route with the correct metadata", () => {
        const path = "/test";
        const t = createMockMethodDecoratorTestTarget(Put, path);

        const routes = Reflect.getMetadata(
            "routes",
            t.prototype.constructor
        ) as RouteDefinition[];

        expect(routes).toBeDefined();
        expect(Array.isArray(routes)).toBe(true);
        expect(routes.length).toBe(1);

        const route = routes[0];

        expect(route.path).toBe(path);
        expect(route.method).toBe(HttpMethod.put);
        expect(route.handlerName).toBe(t.methodName);
    });
});

describe("@Delete", () => {
    it("Registers the route with the correct metadata", () => {
        const path = "/test";
        const t = createMockMethodDecoratorTestTarget(Delete, path);

        const routes = Reflect.getMetadata(
            "routes",
            t.prototype.constructor
        ) as RouteDefinition[];

        expect(routes).toBeDefined();
        expect(Array.isArray(routes)).toBe(true);
        expect(routes.length).toBe(1);

        const route = routes[0];

        expect(route.path).toBe(path);
        expect(route.method).toBe(HttpMethod.delete);
        expect(route.handlerName).toBe(t.methodName);
    });
});
