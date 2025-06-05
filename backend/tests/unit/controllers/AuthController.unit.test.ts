import { AuthController } from "@/controllers";
import { ILecturer, IStudent } from "@/database/schema";
import { IAuthService } from "@/services";
import {
    createMockRequest,
    createMockResponse,
    mockAuthService,
} from "@test/mocks";

describe("AuthController (unit)", () => {
    let controller: AuthController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new AuthController(mockAuthService as IAuthService);
        mockResponse = createMockResponse();
    });

    describe("login", () => {
        type Req = Partial<{ login: string; password: string }>;
        type Res = IStudent | ILecturer | { error: string };

        it("Should return 500 if an error occurs during login", async () => {
            mockAuthService.login.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C00000000", password: "password123" },
            });

            await controller.login(mockRequest, mockResponse);

            expect(mockAuthService.login).toHaveBeenCalledWith(
                "C00000000",
                "password123"
            );

            expect(mockAuthService.createSession).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
});
