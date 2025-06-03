import { Roles } from "@/decorators/roles";
import { useContainer } from "@/dependencies/container";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAuthService } from "@/services";
import { UserRole } from "@/types";
import { RequestHandler } from "express";
import {
    createMockMethodDecoratorTestTarget,
    createMockRequest,
    createMockResponse,
    mockAuthService,
} from "../mocks";
import { createTestContainer } from "../setup/container";

describe("@Roles", () => {
    beforeEach(() => {
        const container = createTestContainer((container) => {
            container.registerInstance(
                dependencyTokens.authService,
                mockAuthService as IAuthService
            );
        });

        useContainer(container);
    });

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
