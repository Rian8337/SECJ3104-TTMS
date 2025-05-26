import { describe, expect, it } from "vitest";
import { createMockMethodDecoratorTestTarget } from "../mocks/mockDecoratorTargetFactory";
import { Roles } from "../../src/decorators/roles";
import { UserRole } from "../../src/types";

describe("@Roles", () => {
    it("Adds middleware metadata", () => {
        const t = createMockMethodDecoratorTestTarget(Roles, UserRole.student);

        const middleware = Reflect.getMetadata(
            "route:middlewares",
            t.prototype,
            t.methodName
        ) as string[];

        expect(middleware).toBeDefined();
        expect(Array.isArray(middleware)).toBe(true);
        expect(middleware.length).toBe(1);
    });
});
