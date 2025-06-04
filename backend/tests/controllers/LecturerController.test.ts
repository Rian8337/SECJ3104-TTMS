import { LecturerController } from "@/controllers";
import { ILecturerService } from "@/services";
import { ITimetable } from "@/types";
import request from "supertest";
import {
    createFailedOperationResultMock,
    createMockRequest,
    createMockResponse,
    createSuccessfulOperationResultMock,
    mockLecturerService,
} from "../mocks";
import { app } from "../setup/app";
import { loginLecturer, loginStudent } from "../setup/auth";
import { seededPrimaryData } from "../setup/db";

describe("LecturerController (unit)", () => {
    let controller: LecturerController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new LecturerController(
            mockLecturerService as ILecturerService
        );

        mockResponse = createMockResponse();
    });

    describe("getTimetable", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            worker_no: string;
        }>;

        type Res = ITimetable[] | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >();

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
                query: { session: "2023/2024" },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if worker_no is missing", async () => {
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
                error: "Worker number is required.",
            });
        });

        it("Should return 400 if worker_no is not a number", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "abcde",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid worker number format.",
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
                    worker_no: "12345",
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
                    worker_no: "12345",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return error if timetable retrieval fails", async () => {
            const result = createFailedOperationResultMock(
                "Database error",
                500
            );

            mockLecturerService.getTimetable.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Database error",
            });
        });

        it("Should return timetable if all parameters are valid", async () => {
            const mockTimetable: ITimetable[] = [];
            const result = createSuccessfulOperationResultMock(mockTimetable);

            mockLecturerService.getTimetable.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    worker_no: "12345",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockTimetable);
        });

        it("Should return 500 if an error occurs", async () => {
            mockLecturerService.getTimetable.mockRejectedValueOnce(
                new Error("Database error")
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
                    worker_no: "12345",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });

            expect(mockLecturerService.getTimetable).toHaveBeenCalledWith(
                12345,
                "2023/2024",
                1
            );
        });
    });
});

describe("LecturerController (integration)", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("GET /lecturer/timetable", () => {
        const endpoint = "/lecturer/timetable";

        describe("Authentication", () => {
            it("Should return 401 if not authenticated", async () => {
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
            const session = seededPrimaryData.sessions[0];
            const lecturer = seededPrimaryData.lecturers[0];

            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    worker_no: lecturer.workerNo.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    worker_no: lecturer.workerNo.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if worker_no is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Worker number is required.",
                });
            });

            it("Should return 400 if worker_no is not a number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    worker_no: "abcde",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid worker number format.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester,
                    worker_no: lecturer.workerNo.toString(),
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
                    worker_no: lecturer.workerNo.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return timetable if all parameters are valid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    worker_no: lecturer.workerNo.toString(),
                });

                expect(res.status).toBe(200);
                expect(res.body).toEqual([]);
            });
        });
    });

    describe("GET /lecturer/venue-clash", () => {
        const endpoint = "/lecturer/venue-clash";

        describe("Authentication", () => {
            it("Should return 401 if not authenticated", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Unauthorized" });
            });

            it("Should return 403 for student requests", async () => {
                await loginStudent(agent);

                const res = await agent.get(endpoint);

                expect(res.status).toBe(403);
                expect(res.body).toEqual({ error: "Forbidden" });
            });

            it("Should not return 401 for lecturer requests", async () => {
                await loginLecturer(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });
        });

        describe("Response", () => {
            const session = seededPrimaryData.sessions[0];
            const lecturer = seededPrimaryData.lecturers[0];

            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
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

            it("Should return 400 if worker_no is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Worker number is required.",
                });
            });

            it("Should return 400 if worker_no is not a number", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    worker_no: "abcde",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid worker number format.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester,
                    worker_no: lecturer.workerNo.toString(),
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
                    worker_no: lecturer.workerNo.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return venue clash data if all parameters are valid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    worker_no: lecturer.workerNo.toString(),
                });

                expect(res.status).toBe(200);
                expect(res.body).toEqual([]);
            });
        });
    });

    describe("GET /lecturer/search", () => {
        const endpoint = "/lecturer/search";

        describe("Authentication", () => {
            it("Should return 401 if not authenticated", async () => {
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
            const session = seededPrimaryData.sessions[0];
            const lecturer = seededPrimaryData.lecturers[0];

            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    query: "John",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    query: "John",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if query is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Query is required.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester,
                    query: "John",
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
                    query: "John",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return lecturer search results if all parameters are valid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    query: lecturer.name.split(" ")[0],
                });

                expect(res.status).toBe(200);
                expect(res.body).toEqual([]);
            });
        });
    });
});
