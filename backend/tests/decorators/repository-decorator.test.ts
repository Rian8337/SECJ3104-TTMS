import { describe, expect, it } from "vitest";
import { Repository } from "../../src/decorators/repository";
import { createMockClassDecoratorTestTarget } from "../mocks";

describe("@Repository", () => {
    it("Registers the repository in the DI global container", () => {
        const testToken = "testToken";

        const registeredClass = createMockClassDecoratorTestTarget(
            Repository,
            testToken
        );

        expect(Reflect.getMetadata("registrationToken", registeredClass)).toBe(
            testToken
        );
    });
});
