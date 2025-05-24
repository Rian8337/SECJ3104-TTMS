import { beforeEach, describe, expect, it, vi } from "vitest";
import { ILecturer } from "../../src/database/schema";
import { ILecturerRepository } from "../../src/repositories";
import { LecturerService, SuccessfulOperationResult } from "../../src/services";
import { ITimetable } from "../../src/types";

describe("LecturerService (unit)", () => {
    let mockLecturerRepository: ILecturerRepository;
    let lecturerService: LecturerService;

    beforeEach(() => {
        mockLecturerRepository = {
            getByWorkerNo: vi.fn((workerNo: number) =>
                Promise.resolve(
                    workerNo === 123456
                        ? ({
                              workerNo: 123456,
                              name: "John Doe",
                          } satisfies ILecturer)
                        : null
                )
            ),

            getTimetable: vi.fn(async (workerNo: number) => {
                const lecturer =
                    await mockLecturerRepository.getByWorkerNo(workerNo);

                if (!lecturer) {
                    return [];
                }

                return [
                    {
                        day: 1,
                        time: 1,
                        courseSection: {
                            section: "1",
                            course: {
                                code: "CS101",
                                name: "Computer Science 101",
                            },
                            lecturer: {
                                name: "John Doe",
                            },
                        },
                        venue: {
                            shortName: "R101",
                        },
                    },
                    {
                        day: 1,
                        time: 2,
                        courseSection: {
                            section: "1",
                            course: {
                                code: "CS101",
                                name: "Computer Science 101",
                            },
                            lecturer: {
                                name: "John Doe",
                            },
                        },
                        venue: {
                            shortName: "R101",
                        },
                    },
                ] satisfies ITimetable[];
            }),

            searchByName: vi.fn(),
        };

        lecturerService = new LecturerService(mockLecturerRepository);
    });

    it("Should return a lecturer by worker number", async () => {
        const result = await lecturerService.getByWorkerNo(123456);

        expect(result).toEqual({
            workerNo: 123456,
            name: "John Doe",
        });

        expect(mockLecturerRepository.getByWorkerNo).toHaveBeenCalledWith(
            123456
        );
    });

    it("Should return null if lecturer is not found", async () => {
        const result = await lecturerService.getByWorkerNo(654321);

        expect(result).toBeNull();

        expect(mockLecturerRepository.getByWorkerNo).toHaveBeenCalledWith(
            654321
        );
    });

    describe("getTimetable", () => {
        it("Should return a timetable for a lecturer", async () => {
            const result = await lecturerService.getTimetable(
                123456,
                "2023/2024",
                "1"
            );

            expect(result.isSuccessful()).toBe(true);
            expect(
                (result as SuccessfulOperationResult<ITimetable[]>).data
            ).toEqual([
                {
                    day: 1,
                    time: 1,
                    courseSection: {
                        section: "1",
                        course: {
                            code: "CS101",
                            name: "Computer Science 101",
                        },
                        lecturer: {
                            name: "John Doe",
                        },
                    },
                    venue: {
                        shortName: "R101",
                    },
                },
                {
                    day: 1,
                    time: 2,
                    courseSection: {
                        section: "1",
                        course: {
                            code: "CS101",
                            name: "Computer Science 101",
                        },
                        lecturer: {
                            name: "John Doe",
                        },
                    },
                    venue: {
                        shortName: "R101",
                    },
                },
            ]);

            expect(mockLecturerRepository.getTimetable).toHaveBeenCalledWith(
                123456,
                "2023/2024",
                "1"
            );
        });

        it("Should return an empty array if lecturer is not found", async () => {
            const result = await lecturerService.getTimetable(
                654321,
                "2023/2024",
                "1"
            );

            expect(result.failed()).toBe(true);
            expect(mockLecturerRepository.getTimetable).not.toHaveBeenCalled();
        });
    });
});
