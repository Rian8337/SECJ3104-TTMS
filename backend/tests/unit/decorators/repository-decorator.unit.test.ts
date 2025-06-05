import { Repository } from "@/decorators/repository";
import { createMockClassDecoratorTestTarget } from "@test/mocks";

describe("@Repository decorator (unit)", () => {
    afterEach(() => {
        // Clear metadata after each test to avoid interference
        const repositories = Reflect.getMetadata(
            "repositories",
            globalThis
        ) as unknown[];

        repositories.pop();
    });

    it("Adds repository metadata and registers the repository to globalThis", () => {
        const testToken = "testToken";

        const registeredClass = createMockClassDecoratorTestTarget(
            Repository,
            testToken
        );

        expect(Reflect.getMetadata("registrationToken", registeredClass)).toBe(
            testToken
        );

        const repositories = Reflect.getMetadata(
            "repositories",
            globalThis
        ) as unknown[];

        expect(repositories).toBeDefined();
        expect(Array.isArray(repositories)).toBe(true);
        expect(repositories).toContain(registeredClass);
    });
});
