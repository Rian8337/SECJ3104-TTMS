import { container } from "tsyringe";
import { afterEach, describe, expect, it } from "vitest";
import { Service } from "../../src/decorators/service";
import { createMockClassDecoratorTestTarget } from "../mocks/mockDecoratorTargetFactory";

describe("@Service", () => {
    afterEach(container.reset.bind(container));

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
