import { StudentController } from "@/controllers";
import { IStudentService } from "@/services";
import { IStudentSearchEntry, ITimetable } from "@/types";
import {
    createMockRequest,
    createMockResponse,
    mockStudentService,
} from "@test/mocks";

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
