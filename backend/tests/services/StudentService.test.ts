import { beforeEach, describe, expect, it, vi } from "vitest";
import { IStudent } from "../../src/database/schema";
import { IStudentRepository } from "../../src/repositories";
import {
    FailedOperationResult,
    StudentService,
    SuccessfulOperationResult,
} from "../../src/services";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    ITimetable,
} from "../../src/types";

describe("StudentService (unit)", () => {
    const students: IStudent[] = [
        {
            matricNo: "A12345678",
            name: "John Doe",
            courseCode: "SECJH",
            facultyCode: "FSKSM",
            kpNo: "123456789012",
        },
        {
            matricNo: "B76543210",
            name: "Jane Smith",
            courseCode: "SECVH",
            facultyCode: "FC",
            kpNo: "098765432109",
        },
    ];

    const timetables: ITimetable[] = [
        {
            day: CourseSectionScheduleDay.monday,
            time: CourseSectionScheduleTime.time2,
            courseSection: {
                section: "1",
                course: {
                    code: "CS101",
                    name: "Introduction to Computer Science",
                },
                lecturer: { name: "Dr. Alice Johnson" },
            },
            venue: null,
        },
        {
            day: CourseSectionScheduleDay.tuesday,
            time: CourseSectionScheduleTime.time3,
            courseSection: {
                section: "2",
                course: {
                    code: "CS102",
                    name: "Data Structures",
                },
                lecturer: { name: "Prof. Bob Smith" },
            },
            venue: { shortName: "Lab 1" },
        },
    ];

    let mockStudentRepository: IStudentRepository;
    let studentService: StudentService;

    beforeEach(() => {
        mockStudentRepository = {
            getByMatricNo: vi.fn<IStudentRepository["getByMatricNo"]>(
                (matricNo) =>
                    Promise.resolve(
                        students.find(
                            (student) => student.matricNo === matricNo
                        ) ?? null
                    )
            ),

            getTimetable: vi.fn<IStudentRepository["getTimetable"]>(() =>
                Promise.resolve(timetables)
            ),

            searchByMatricNo: vi.fn<IStudentRepository["searchByMatricNo"]>(
                (matricNo, limit = 10, offset = 0) =>
                    Promise.resolve(
                        students
                            .filter((student) =>
                                student.matricNo.includes(matricNo)
                            )
                            .slice(offset, offset + limit)
                    )
            ),

            searchByName: vi.fn<IStudentRepository["searchByName"]>(
                (name, limit = 10, offset = 0) =>
                    Promise.resolve(
                        students
                            .filter((student) =>
                                student.name
                                    .toLowerCase()
                                    .includes(name.toLowerCase())
                            )
                            .slice(offset, offset + limit)
                    )
            ),
        };

        studentService = new StudentService(mockStudentRepository);
    });

    describe("getByMatricNo", () => {
        it("Should get student by matric number", async () => {
            const student = await studentService.getByMatricNo("A12345678");

            expect(student).toEqual(students[0]);
            expect(mockStudentRepository.getByMatricNo).toHaveBeenCalledWith(
                "A12345678"
            );
        });

        it("Should return null for non-existent student", async () => {
            const student = await studentService.getByMatricNo("C0000000");

            expect(student).toBeNull();
            expect(mockStudentRepository.getByMatricNo).toHaveBeenCalledWith(
                "C0000000"
            );
        });
    });

    describe("getTimetable", () => {
        it("Should get timetable for student", async () => {
            const result = await studentService.getTimetable(
                "A12345678",
                "2023/2024",
                "1"
            );

            expect(result.isSuccessful()).toBe(true);

            expect(
                (result as SuccessfulOperationResult<ITimetable[]>).data
            ).toEqual(timetables);

            expect(mockStudentRepository.getByMatricNo).toHaveBeenCalledWith(
                "A12345678"
            );

            expect(mockStudentRepository.getTimetable).toHaveBeenCalledWith(
                "A12345678",
                "2023/2024",
                "1"
            );
        });

        it("Should return error for non-existent student timetable", async () => {
            const result = await studentService.getTimetable(
                "C0000000",
                "2023/2024",
                "1"
            );

            const failedResult = result as FailedOperationResult;

            expect(failedResult.failed()).toBe(true);
            expect(result.status).toBe(404);
            expect(failedResult.error).toBe("Student not found");

            expect(mockStudentRepository.getByMatricNo).toHaveBeenCalledWith(
                "C0000000"
            );

            expect(mockStudentRepository.getTimetable).not.toHaveBeenCalled();
        });
    });

    describe("search", () => {
        it("Should return error if query is less than 3 characters", async () => {
            const result = await studentService.search("AB", 10, 0);
            const failedResult = result as FailedOperationResult;

            expect(failedResult.failed()).toBe(true);
            expect(result.status).toBe(400);
            expect(failedResult.error).toBe(
                "Query must be at least 3 characters long"
            );

            expect(
                mockStudentRepository.searchByMatricNo
            ).not.toHaveBeenCalled();

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should return empty result for matric number that is not 9 in length", async () => {
            const result = await studentService.search("A1234567", 10, 0);
            const successfulResult = result as SuccessfulOperationResult<
                IStudent[]
            >;

            expect(successfulResult.isSuccessful()).toBe(true);
            expect(successfulResult.data.length).toBe(0);

            expect(
                mockStudentRepository.searchByMatricNo
            ).not.toHaveBeenCalled();

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should search by matric number", async () => {
            const result = await studentService.search("A12345678", 10, 0);
            const successfulResult = result as SuccessfulOperationResult<
                IStudent[]
            >;

            expect(successfulResult.isSuccessful()).toBe(true);
            expect(successfulResult.data).toEqual([students[0]]);

            expect(mockStudentRepository.searchByMatricNo).toHaveBeenCalledWith(
                "A12345678",
                10,
                0
            );

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should search by name", async () => {
            const result = await studentService.search("Jane", 10, 0);
            const successfulResult = result as SuccessfulOperationResult<
                IStudent[]
            >;

            expect(successfulResult.isSuccessful()).toBe(true);
            expect(successfulResult.data).toEqual([students[1]]);

            expect(mockStudentRepository.searchByName).toHaveBeenCalledWith(
                "Jane",
                10,
                0
            );

            expect(
                mockStudentRepository.searchByMatricNo
            ).not.toHaveBeenCalled();
        });
    });
});
