import { beforeEach, describe, expect, it } from "vitest";
import { StudentController } from "../../src/controllers/StudentController";
import { IStudent } from "../../src/database/schema";
import { IStudentSearchEntry, ITimetable } from "../../src/types";
import {
    createFailedOperationResultMock,
    createSuccessfulOperationResultMock,
    mockAuthService,
    mockStudentService,
} from "../mocks";
import {
    createMockRequest,
    createMockResponse,
} from "../mocks/expressMockFactory";

describe("StudentController", () => {
    let controller: StudentController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new StudentController(mockStudentService, mockAuthService);
        mockResponse = createMockResponse();
    });

    describe("login", () => {
        type Req = Partial<{ login: string; password: string }>;
        type Res = IStudent | { error: string };

        const mockStudent: IStudent = {
            matricNo: "C0000000",
            name: "John Doe",
            courseCode: "CS101",
            facultyCode: "ENG",
            kpNo: "password123",
        };

        it("Should return 400 if login is missing", async () => {
            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { password: "password123" },
            });

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
            mockStudentService.getByMatricNo.mockResolvedValue(mockStudent);

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C0000000", password: "wrongpassword" },
            });

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
            mockStudentService.getByMatricNo.mockResolvedValue(mockStudent);

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C0000000", password: "password123" },
            });

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

        it("Should return 500 if an error occurs during login", async () => {
            mockStudentService.getByMatricNo.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

            const mockRequest = createMockRequest<"/login", Res, Req>({
                body: { login: "C0000000", password: "password123" },
            });

            await controller.login(mockRequest, mockResponse);

            expect(mockStudentService.getByMatricNo).toHaveBeenCalledWith(
                "C0000000"
            );

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

    describe("getTimetable", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            matric_no: string;
        }>;

        type Res = ITimetable[] | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { semester: "2023/2024", matric_no: "C0000000" },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Academic session is required.",
            });
        });

        it("Should return 400 if semester is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", matric_no: "C0000000" },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if matric number is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", semester: "1" },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Matric number is required.",
            });
        });

        it("Should return 400 if session format is invalid", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023-2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });
        });

        it("Should return 400 if semester is invalid", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "4",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return error if timetable retrieval operation fails", async () => {
            const result = createFailedOperationResultMock(
                "Internal server error",
                500
            );

            mockStudentService.getTimetable.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockStudentService.getTimetable).toHaveBeenCalledWith(
                "C0000000",
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });

        it("Should return timetable if retrieval is successful", async () => {
            const mockTimetable: ITimetable[] = [];
            const result = createSuccessfulOperationResultMock(mockTimetable);

            mockStudentService.getTimetable.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockStudentService.getTimetable).toHaveBeenCalledWith(
                "C0000000",
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockTimetable);
        });

        it("Should return 500 if timetable retrieval throws an error", async () => {
            mockStudentService.getTimetable.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockStudentService.getTimetable).toHaveBeenCalledWith(
                "C0000000",
                "2023/2024",
                1
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });

    describe("search", () => {
        type Req = Partial<{ query: string; limit: string; offset: string }>;
        type Res = IStudentSearchEntry[] | { error: string };

        it("Should return 400 if query is missing", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >();

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Query is required",
            });
        });

        it("Should return 400 if limit is not a number", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { query: "John", limit: "not-a-number" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid limit",
            });
        });

        it("Should return 400 if limit is less than 0", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { query: "John", limit: "-1" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid limit",
            });
        });

        it("Should return 400 if offset is not a number", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { query: "John", offset: "not-a-number" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid offset",
            });
        });

        it("Should return 400 if offset is less than 0", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { query: "John", offset: "-1" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid offset",
            });
        });

        it("Should return error if search operation fails", async () => {
            const result = createFailedOperationResultMock(
                "Internal server error",
                500
            );

            mockStudentService.search.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { query: "John", limit: "10", offset: "0" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "John",
                10,
                0
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });

        it("Should return search results if operation is successful", async () => {
            const mockSearchResults: IStudentSearchEntry[] = [
                { matricNo: "C0000001", name: "John Doe" },
                { matricNo: "C0000002", name: "Jane Smith" },
            ];

            const result =
                createSuccessfulOperationResultMock(mockSearchResults);

            mockStudentService.search.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { query: "John", limit: "10", offset: "0" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "John",
                10,
                0
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockSearchResults);
        });

        it("Should return 500 if search throws an error", async () => {
            mockStudentService.search.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { query: "John", limit: "10", offset: "0" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "John",
                10,
                0
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
});
