import { describe, expect, it } from "vitest";
import { Service } from "../../src/decorators/service";
import { createMockClassDecoratorTestTarget } from "../mocks/mockDecoratorTargetFactory";
import { container } from "tsyringe";

describe("@Service", () => {
    it("Registers the service in the DI global container", () => {
        const testToken = "testToken";

        const registeredClass = createMockClassDecoratorTestTarget(
            Service,
            testToken
        );

        expect(container.isRegistered(testToken)).toBe(true);
        expect(container.resolve(testToken)).toBeInstanceOf(registeredClass);
    });
});
