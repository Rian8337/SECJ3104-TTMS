import { AuthController } from "@/controllers";
import { IStudent, ILecturer } from "@/database/schema";
import {
    createMockRequest,
    createMockResponse,
    createSuccessfulOperationResultMock,
    mockAuthService,
} from "../mocks";
import { IAuthService } from "@/services";

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

        it("Should return 400 if login is missing", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { password: "password123" },
            });

            await controller.login(mockRequest, mockResponse);

            expect(mockAuthService.login).not.toHaveBeenCalled();
            expect(mockAuthService.createSession).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Login and password are required",
            });
        });

        it("Should return 400 if password is missing", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C00000000" },
            });

            await controller.login(mockRequest, mockResponse);

            expect(mockAuthService.login).not.toHaveBeenCalled();
            expect(mockAuthService.createSession).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Login and password are required",
            });
        });

        it("Should return data if login is successful", async () => {
            mockAuthService.login.mockResolvedValueOnce(
                createSuccessfulOperationResultMock({})
            );

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C00000000", password: "password123" },
            });

            await controller.login(mockRequest, mockResponse);

            expect(mockAuthService.login).toHaveBeenCalledWith(
                "C00000000",
                "password123"
            );

            expect(mockAuthService.createSession).toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({});
        });

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

    it("[logout] should clear session and return 200", () => {
        const mockRequest = createMockRequest<"/logout">();

        controller.logout(mockRequest, mockResponse);

        expect(mockAuthService.clearSession).toHaveBeenCalledWith(mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);
    });
});
