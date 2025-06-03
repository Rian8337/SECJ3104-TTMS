import { Service } from "@/decorators/service";
import { createMockClassDecoratorTestTarget } from "../mocks";

describe("@Service", () => {
    it("Registers the service in the DI global container", () => {
        const testToken = "testToken";

        const registeredClass = createMockClassDecoratorTestTarget(
            Service,
            testToken
        );

        expect(Reflect.getMetadata("registrationToken", registeredClass)).toBe(
            testToken
        );
    });
});
