import { describe, expect, it, vi } from "vitest";
import { Roles } from "../../src/decorators/roles";
import { UserRole } from "../../src/types";
import {
    createMockMethodDecoratorTestTarget,
    createMockRequest,
    createMockResponse,
    mockAuthService,
} from "../mocks";
import { RequestHandler } from "express";

describe("@Roles", () => {
    it("Adds middleware metadata", () => {
        const t = createMockMethodDecoratorTestTarget(Roles, UserRole.student);

        const middlewares = Reflect.getMetadata(
            "route:middlewares",
            t.prototype,
            t.methodName
        ) as RequestHandler[];

        expect(middlewares).toBeDefined();
        expect(Array.isArray(middlewares)).toBe(true);
        expect(middlewares.length).toBe(1);
    });

    it("Adds middleware that checks user role", async () => {
        mockAuthService.verifySession.mockReturnValueOnce((req, res, next) => {
            next();
        });

        const t = createMockMethodDecoratorTestTarget(Roles, UserRole.student);

        const middlewares = Reflect.getMetadata(
            "route:middlewares",
            t.prototype,
            t.methodName
        ) as RequestHandler[];

        expect(middlewares).toBeDefined();
        expect(middlewares.length).toBe(1);

        const middleware = middlewares[0];
        expect(middleware).toBeInstanceOf(Function);

        await middleware(createMockRequest(), createMockResponse(), vi.fn());

        expect(mockAuthService.verifySession).toHaveBeenCalledWith(
            UserRole.student
        );
    });
});
