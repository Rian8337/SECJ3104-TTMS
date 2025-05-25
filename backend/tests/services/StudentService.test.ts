import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { IStudent } from "../../src/database/schema";
import { FailedOperationResult, StudentService } from "../../src/services";
import {
    createMockContainer,
    mockStudentRepository,
} from "../utils/mockContainerFactory";

describe("StudentService (unit)", () => {
    beforeAll(createMockContainer);
    afterEach(vi.resetAllMocks.bind(vi));

    it("[getByMatricNo] should get student by matric number from repository", async () => {
        const service = new StudentService(mockStudentRepository);
        await service.getByMatricNo("A12345678");

        expect(mockStudentRepository.getByMatricNo).toHaveBeenCalledWith(
            "A12345678"
        );
    });

    describe("getTimetable", () => {
        it("Should get timetable for student", async () => {
            mockStudentRepository.getByMatricNo.mockResolvedValueOnce({
                matricNo: "A12345678",
                name: "John Doe",
                courseCode: "SECJH",
                facultyCode: "FSKSM",
                kpNo: "123456789012",
            } satisfies IStudent);

            const service = new StudentService(mockStudentRepository);

            const result = await service.getTimetable(
                "A12345678",
                "2023/2024",
                "1"
            );

            expect(result.isSuccessful()).toBe(true);

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
            mockStudentRepository.getByMatricNo.mockResolvedValueOnce(null);

            const service = new StudentService(mockStudentRepository);

            const result = await service.getTimetable(
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
            const service = new StudentService(mockStudentRepository);
            const result = await service.search("AB", 10, 0);
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
            const service = new StudentService(mockStudentRepository);
            const result = await service.search("A1234567", 10, 0);

            expect(result.isSuccessful()).toBe(true);

            expect(
                mockStudentRepository.searchByMatricNo
            ).not.toHaveBeenCalled();

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should search by matric number", async () => {
            const service = new StudentService(mockStudentRepository);
            const result = await service.search("A12345678", 10, 0);

            expect(result.isSuccessful()).toBe(true);

            expect(mockStudentRepository.searchByMatricNo).toHaveBeenCalledWith(
                "A12345678",
                10,
                0
            );

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should search by name", async () => {
            const service = new StudentService(mockStudentRepository);
            const result = await service.search("Jane", 10, 0);

            expect(result.isSuccessful()).toBe(true);

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
