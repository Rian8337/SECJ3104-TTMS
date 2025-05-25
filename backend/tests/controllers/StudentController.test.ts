import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { StudentController } from "../../src/controllers/StudentController";
import { IStudent } from "../../src/database/schema";
import { IStudentService } from "../../src/services";
import {
    createMockRequest,
    createMockResponse,
} from "../utils/expressMockFactory";
import {
    createMockContainer,
    mockAuthService,
    mockStudentService,
} from "../utils/mockContainerFactory";

describe("StudentController", () => {
    beforeAll(createMockContainer);
    afterEach(vi.resetAllMocks.bind(vi));

    describe("login", () => {
        type Req = Partial<{ login: string; password: string }>;
        type Res = IStudent | { error: string };

        it("Should return 400 if login is missing", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { password: "password123" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new StudentController(
                mockStudentService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockStudentService.getByMatricNo).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Login and password are required",
            });
        });

        it("Should return 400 if password is missing", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C0000000" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new StudentController(
                mockStudentService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockStudentService.getByMatricNo).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Login and password are required",
            });
        });

        it("Should return 401 if student not found", async () => {
            mockStudentService.getByMatricNo.mockResolvedValue(null);

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C0000000", password: "password123" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new StudentController(
                mockStudentService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockStudentService.getByMatricNo).toHaveBeenCalledWith(
                "C0000000"
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid username or password",
            });
        });

        it("Should return 401 if password is incorrect", async () => {
            mockStudentService.getByMatricNo.mockResolvedValue({
                matricNo: "C0000000",
                kpNo: "wrongPassword",
            } satisfies Partial<IStudent>);

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C0000000", password: "password123" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new StudentController(
                mockStudentService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockStudentService.getByMatricNo).toHaveBeenCalledWith(
                "C0000000"
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid username or password",
            });
        });

        it("Should return student if login is successful", async () => {
            const mockStudent: IStudent = {
                matricNo: "C0000000",
                name: "John Doe",
                courseCode: "CS101",
                facultyCode: "ENG",
                kpNo: "password123",
            };

            mockStudentService.getByMatricNo = vi
                .fn<IStudentService["getByMatricNo"]>()
                .mockResolvedValue(mockStudent);

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C0000000", password: "password123" },
            });

            const mockResponse = createMockResponse<Res>();

            const controller = new StudentController(
                mockStudentService,
                mockAuthService
            );

            await controller.login(mockRequest, mockResponse);

            expect(mockStudentService.getByMatricNo).toHaveBeenCalledWith(
                "C0000000"
            );

            expect(mockAuthService.createSession).toHaveBeenCalledWith(
                mockResponse,
                mockStudent
            );

            expect(mockResponse.json).toHaveBeenCalledWith(mockStudent);
        });
    });
});
