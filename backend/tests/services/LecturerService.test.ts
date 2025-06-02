import { beforeEach, describe, expect, it } from "vitest";
import { ILecturer } from "../../src/database/schema";
import { FailedOperationResult, LecturerService } from "../../src/services";
import { mockLecturerRepository, mockVenueRepository } from "../mocks";
import { IRawTimetable } from "../../src/types";

describe("LecturerService (unit)", () => {
    let service: LecturerService;

    beforeEach(() => {
        service = new LecturerService(
            mockLecturerRepository,
            mockVenueRepository
        );
    });

    it("[getByWorkerNo] should get a lecturer by worker number from repository", async () => {
        await service.getByWorkerNo(123456);

        expect(mockLecturerRepository.getByWorkerNo).toHaveBeenCalledWith(
            123456
        );
    });

    describe("getTimetable", () => {
        it("Should return an empty array if lecturer is not found", async () => {
            mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce(null);

            const result = await service.getTimetable(654321, "2023/2024", "1");
            const failedResult = result as FailedOperationResult;

            expect(result.failed()).toBe(true);

            expect(failedResult.status).toBe(404);
            expect(failedResult.error).toBe("Lecturer not found");

            expect(mockLecturerRepository.getByWorkerNo).toHaveBeenCalledWith(
                654321
            );

            expect(mockLecturerRepository.getTimetable).not.toHaveBeenCalled();
        });

        it("Should return a timetable for a lecturer", async () => {
            mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce({
                workerNo: 123456,
                name: "John Doe",
            } satisfies ILecturer);

            mockLecturerRepository.getTimetable.mockResolvedValueOnce([
                {
                    courseCode: "CS101",
                    courseName: "Introduction to Computer Science",
                    section: "1",
                    lecturerName: "John Doe",
                    lecturerNo: 123456,
                    scheduleDay: 1,
                    scheduleTime: 2,
                    venueShortName: "Room 101",
                },
                {
                    courseCode: "CS102",
                    courseName: "Data Structures",
                    section: "1",
                    lecturerName: "John Doe",
                    lecturerNo: 123456,
                    scheduleDay: 1,
                    scheduleTime: 3,
                    venueShortName: "Room 102",
                },
            ] satisfies IRawTimetable[]);

            const result = await service.getTimetable(123456, "2023/2024", "1");

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(mockLecturerRepository.getTimetable).toHaveBeenCalledWith(
                123456,
                "2023/2024",
                "1"
            );
        });
    });
});
