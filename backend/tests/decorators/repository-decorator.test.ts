import { container } from "tsyringe";
import { afterEach, describe, expect, it } from "vitest";
import { Repository } from "../../src/decorators/repository";
import { createMockClassDecoratorTestTarget } from "../mocks/mockDecoratorTargetFactory";

describe("@Repository", () => {
    afterEach(container.reset.bind(container));

    it("Registers the repository in the DI global container", () => {
        const testToken = "testToken";

        const registeredClass = createMockClassDecoratorTestTarget(
            Repository,
            testToken
        );

        expect(container.isRegistered(testToken)).toBe(true);
        expect(container.resolve(testToken)).toBeInstanceOf(registeredClass);
    });
});
