import { StudentController } from "@/controllers";
import { IStudentService } from "@/services";
import { IStudentSearchEntry, ITimetable } from "@/types";
import request from "supertest";
import {
    createFailedOperationResultMock,
    createMockRequest,
    createMockResponse,
    createSuccessfulOperationResultMock,
    mockStudentService,
} from "../mocks";
import { app } from "../setup/app";
import { loginLecturer, loginStudent } from "../setup/auth";
import {
    cleanupSecondaryTables,
    seededPrimaryData,
    seeders,
} from "../setup/db";

describe("StudentController (unit)", () => {
    let controller: StudentController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new StudentController(
            mockStudentService as IStudentService
        );

        mockResponse = createMockResponse();
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
        type Req = Partial<{
            session: string;
            semester: string;
            query: string;
            limit: string;
            offset: string;
        }>;

        type Res = IStudentSearchEntry[] | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { semester: "2023/2024", query: "C0000000" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Academic session is required.",
            });
        });

        it("Should return 400 if semester is missing", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", query: "C0000000" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if session format is invalid", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023-2024",
                    semester: "1",
                    query: "test",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });
        });

        it("Should return 400 if semester is invalid", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "4",
                    query: "test",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return 400 if query is missing", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                },
            });

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
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "not-a-number",
                },
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
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "-1",
                },
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
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    offset: "not-a-number",
                },
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
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    offset: "-1",
                },
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
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "10",
                    offset: "0",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "2023/2024",
                1,
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
                { matricNo: "C0000001", name: "John Doe", courseCode: "SECJH" },
                {
                    matricNo: "C0000002",
                    name: "Jane Smith",
                    courseCode: "SECVH",
                },
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
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "10",
                    offset: "0",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "2023/2024",
                1,
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
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "10",
                    offset: "0",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "2023/2024",
                1,
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

describe("StudentController (integration)", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("GET /student/timetable", () => {
        const session = seededPrimaryData.sessions[0];
        const endpoint = "/student/timetable";

        describe("Authentication", () => {
            it("Should return 401 for unauthenticated requests", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Unauthorized" });
            });

            it("Should not return 401 for student requests", async () => {
                await loginStudent(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });

            it("Should not return 401 for lecturer requests", async () => {
                await loginLecturer(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });
        });

        describe("Response", () => {
            const student = seededPrimaryData.students[0];

            beforeEach(async () => {
                await loginStudent(agent);
            });

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if matric number is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Matric number is required.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester.toString(),
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid session format. Expected format: YYYY/YYYY.",
                });
            });

            it("Should return 400 if semester is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: "4",
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return 200 and timetable if request is valid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    matric_no: student.matricNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toEqual([]);
            });
        });
    });

    describe("GET /student/search", () => {
        const session = seededPrimaryData.sessions[0];
        const endpoint = "/student/search";

        describe("Authentication", () => {
            it("Should return 401 for unauthenticated requests", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Unauthorized" });
            });

            it("Should not return 401 for student requests", async () => {
                await loginStudent(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });

            it("Should not return 401 for lecturer requests", async () => {
                await loginLecturer(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });
        });

        describe("Response", () => {
            const student = seededPrimaryData.students[0];

            beforeAll(async () => {
                const course = seededPrimaryData.courses[0];

                const section = await seeders.courseSection.seedOne({
                    courseCode: course.code,
                    section: "1",
                    semester: session.semester,
                    session: session.session,
                });

                await seeders.studentRegisteredCourse.seedOne({
                    courseCode: course.code,
                    section: section.section,
                    matricNo: student.matricNo,
                    semester: session.semester,
                    session: session.session,
                });
            });

            beforeEach(async () => {
                await loginStudent(agent);
            });

            afterAll(cleanupSecondaryTables);

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester.toString(),
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester.toString(),
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid session format. Expected format: YYYY/YYYY.",
                });
            });

            it("Should return 400 if semester is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: "4",
                    query: "C0000000",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return 400 if query is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Query is required",
                });
            });

            it("Should return 400 if limit is not a number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    limit: "not-a-number",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid limit",
                });
            });

            it("Should return 400 if limit is less than 1", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    limit: "-1",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid limit",
                });
            });

            it("Should return 400 if offset is not a number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    offset: "not-a-number",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid offset",
                });
            });

            it("Should return 400 if offset is less than 0", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: "John",
                    offset: "-1",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid offset",
                });
            });

            it("Should return search based on matric number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: student.matricNo,
                });

                expect(res.status).toBe(200);
                expect(res.body).toContainEqual({
                    matricNo: student.matricNo,
                    name: student.name,
                    courseCode: student.courseCode,
                });
            });

            it("Should return search based on name", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester.toString(),
                    query: student.name.split(" ")[0],
                });

                expect(res.status).toBe(200);
                expect(res.body).toContainEqual({
                    matricNo: student.matricNo,
                    name: student.name,
                    courseCode: student.courseCode,
                });
            });
        });
    });
});
