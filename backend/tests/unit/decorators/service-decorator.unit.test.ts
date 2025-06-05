import { Service } from "@/decorators/service";
import { createMockClassDecoratorTestTarget } from "@test/mocks";

describe("@Service decorator (unit)", () => {
    afterEach(() => {
        // Clear metadata after each test to avoid interference
        const services = Reflect.getMetadata(
            "services",
            globalThis
        ) as unknown[];

        services.pop();
    });

    it("Adds service metadata and registers the service to globalThis", () => {
        const testToken = "testToken";

        const registeredClass = createMockClassDecoratorTestTarget(
            Service,
            testToken
        );

        expect(Reflect.getMetadata("registrationToken", registeredClass)).toBe(
            testToken
        );

        const services = Reflect.getMetadata(
            "services",
            globalThis
        ) as unknown[];

        expect(services).toBeDefined();
        expect(Array.isArray(services)).toBe(true);
        expect(services).toContain(registeredClass);
    });
});
