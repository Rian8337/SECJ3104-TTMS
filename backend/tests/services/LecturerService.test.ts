import { beforeEach, describe, expect, it } from "vitest";
import { ILecturer } from "../../src/database/schema";
import {
    FailedOperationResult,
    LecturerService,
    SuccessfulOperationResult,
} from "../../src/services";
import { ITimetable, ITimetableClash } from "../../src/types";
import { mockLecturerRepository } from "../mocks";

describe("LecturerService (unit)", () => {
    let service: LecturerService;

    beforeEach(() => {
        service = new LecturerService(mockLecturerRepository);
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

            const result = await service.getTimetable(123456, "2023/2024", "1");

            expect(result.isSuccessful()).toBe(true);

            expect(mockLecturerRepository.getTimetable).toHaveBeenCalledWith(
                123456,
                "2023/2024",
                "1"
            );
        });
    });

    describe("getClashingTimetable", () => {
        it("Should fail if the lecturer is not found", async () => {
            const result = await service.getClashingTimetable(
                654321,
                "2023/2024",
                "1"
            );

            const failedResult = result as FailedOperationResult;

            expect(result.failed()).toBe(true);

            expect(failedResult.status).toBe(404);
            expect(failedResult.error).toBe("Lecturer not found");

            expect(mockLecturerRepository.getByWorkerNo).toHaveBeenCalledWith(
                654321
            );

            expect(
                mockLecturerRepository.getClashingTimetable
            ).not.toHaveBeenCalled();
        });

        it("Should return an empty array if the timetable is empty", async () => {
            mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce({
                workerNo: 123456,
                name: "John Doe",
            } satisfies ILecturer);

            mockLecturerRepository.getClashingTimetable.mockResolvedValueOnce(
                []
            );

            const result = await service.getClashingTimetable(
                123456,
                "2023/2024",
                "1"
            );

            const successfulResult = result as SuccessfulOperationResult<
                ITimetableClash[]
            >;

            expect(result.isSuccessful()).toBe(true);
            expect(successfulResult.data).toEqual([]);

            expect(
                mockLecturerRepository.getClashingTimetable
            ).toHaveBeenCalledWith(123456, "2023/2024", "1");
        });

        it("Should return a list of timetable clashes", async () => {
            mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce({
                workerNo: 123456,
                name: "John Doe",
            } satisfies ILecturer);

            const mockTimetable: ITimetable[] = [
                {
                    day: 1,
                    time: 1,
                    courseSection: {
                        section: "2",
                        course: {
                            code: "CS102",
                            name: "Computer Science 102",
                        },
                        lecturer: { name: "John Doe" },
                    },
                    venue: { shortName: "R101" },
                },
                {
                    day: 1,
                    time: 1,
                    courseSection: {
                        section: "1",
                        course: {
                            code: "CS101",
                            name: "Computer Science 101",
                        },
                        lecturer: { name: "John Doe" },
                    },
                    venue: { shortName: "R101" },
                },
            ];

            mockLecturerRepository.getClashingTimetable.mockResolvedValueOnce(
                mockTimetable
            );

            const result = await service.getClashingTimetable(
                123456,
                "2023/2024",
                "1"
            );

            const successfulResult = result as SuccessfulOperationResult<
                ITimetableClash[]
            >;

            expect(result.isSuccessful()).toBe(true);
            expect(successfulResult.data).toEqual([
                {
                    day: 1,
                    time: 1,
                    courseSections: [
                        {
                            section: "2",
                            course: {
                                code: "CS102",
                                name: "Computer Science 102",
                            },
                            lecturer: { name: "John Doe" },
                        },
                        {
                            section: "1",
                            course: {
                                code: "CS101",
                                name: "Computer Science 101",
                            },
                            lecturer: { name: "John Doe" },
                        },
                    ],
                    venue: { shortName: "R101" },
                },
            ] satisfies ITimetableClash[]);

            expect(
                mockLecturerRepository.getClashingTimetable
            ).toHaveBeenCalledWith(123456, "2023/2024", "1");
        });
    });
});
