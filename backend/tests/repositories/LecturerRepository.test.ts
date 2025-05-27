import { beforeEach, describe, expect, it } from "vitest";
import { LecturerRepository } from "../../src/repositories";
import { mockDb } from "../mocks";
import {
    courseSections,
    courseSectionSchedules,
    lecturers,
} from "../../src/database/schema";
import { sql } from "drizzle-orm";

describe("LecturerRepository (unit)", () => {
    let repository: LecturerRepository;

    beforeEach(() => {
        repository = new LecturerRepository(mockDb);
    });

    it("[getByWorkerNo] Should query database", async () => {
        mockDb.select.mockReturnValueOnce({
            from: mockDb.from.mockReturnValueOnce({
                where: mockDb.where.mockReturnValueOnce({
                    limit: mockDb.limit.mockResolvedValueOnce([]),
                }),
            }),
        });

        await repository.getByWorkerNo(12345);

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledWith(lecturers);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.where).toHaveBeenCalled();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

        expect(mockDb.limit).toHaveBeenCalledWith(1);
        expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);
    });

    describe("getTimetable", () => {
        it("Should only query database once if there are no registered courses", async () => {
            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockResolvedValueOnce([]),
                }),
            });

            await repository.getTimetable(12345, "2023/2024", "1");

            expect(mockDb.select).toHaveBeenCalledTimes(1);
            expect(mockDb.select).toHaveBeenCalledWith({
                courseCode: courseSections.courseCode,
                section: courseSections.section,
            });

            expect(mockDb.from).toHaveBeenCalledWith(courseSections);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalled();
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).not.toHaveBeenCalled();
        });

        it("Should query courseSectionSchedules if there are registered courses", async () => {
            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockResolvedValueOnce([
                        { courseCode: "CS101", section: "A" },
                        { courseCode: "CS102", section: "B" },
                    ]),
                }),
            });

            mockDb.query.courseSectionSchedules.findMany.mockResolvedValueOnce(
                []
            );

            await repository.getTimetable(12345, "2023/2024", "1");

            expect(mockDb.select).toHaveBeenCalledTimes(1);
            expect(mockDb.select).toHaveBeenCalledWith({
                courseCode: courseSections.courseCode,
                section: courseSections.section,
            });

            expect(mockDb.from).toHaveBeenCalledWith(courseSections);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalled();
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    columns: {
                        day: true,
                        time: true,
                    },
                    with: {
                        courseSection: {
                            columns: { section: true },
                            with: {
                                course: { columns: { code: true, name: true } },
                                lecturer: true,
                            },
                        },
                        venue: { columns: { shortName: true } },
                    },
                    where: expect.anything() as unknown,
                })
            );

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).toHaveBeenCalledAfter(mockDb.where);
        });
    });

    describe("getClashingTimetable", () => {
        it("Should only query database once if there are no registered courses", async () => {
            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockResolvedValueOnce([]),
                }),
            });

            await repository.getClashingTimetable(12345, "2023/2024", "1");

            expect(mockDb.select).toHaveBeenCalledTimes(1);
            expect(mockDb.select).toHaveBeenCalledWith({
                courseCode: courseSections.courseCode,
                section: courseSections.section,
            });

            expect(mockDb.from).toHaveBeenCalledWith(courseSections);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalled();
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);
        });

        it("Should only query database twice if lecturer timetable is empty", async () => {
            mockDb.select.mockReturnValue({
                from: mockDb.from.mockReturnValue({
                    where: mockDb.where
                        .mockResolvedValueOnce([
                            { courseCode: "CS101", section: "A" },
                            { courseCode: "CS102", section: "B" },
                        ])
                        .mockReturnValueOnce([]),
                }),
            });

            await repository.getClashingTimetable(12345, "2023/2024", "1");

            expect(mockDb.select).toHaveBeenCalledTimes(2);
            expect(mockDb.select).toHaveBeenNthCalledWith(1, {
                courseCode: courseSections.courseCode,
                section: courseSections.section,
            });
            expect(mockDb.select).toHaveBeenNthCalledWith(2, {
                day: courseSectionSchedules.day,
                time: courseSectionSchedules.time,
                courseCode: courseSectionSchedules.courseCode,
                section: courseSectionSchedules.section,
                venueCode: courseSectionSchedules.venueCode,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(2);
            expect(mockDb.from).toHaveBeenNthCalledWith(1, courseSections);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                2,
                courseSectionSchedules
            );
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenNthCalledWith(
                1,
                expect.anything() as unknown
            );
            expect(mockDb.where).toHaveBeenNthCalledWith(
                2,
                expect.anything() as unknown
            );
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).not.toHaveBeenCalled();
        });

        it("Should query courseSectionSchedules if lecturer timetable is not empty", async () => {
            mockDb.select.mockReturnValue({
                from: mockDb.from.mockReturnValue({
                    where: mockDb.where
                        .mockResolvedValueOnce([
                            { courseCode: "CS101", section: "A" },
                            { courseCode: "CS102", section: "B" },
                        ])
                        .mockResolvedValueOnce([
                            {
                                day: "Monday",
                                time: "10:00-12:00",
                                courseCode: "CS101",
                                section: "A",
                                venueCode: "V001",
                            },
                        ]),
                }),
            });

            mockDb.query.courseSectionSchedules.findMany.mockResolvedValueOnce(
                []
            );

            await repository.getClashingTimetable(12345, "2023/2024", "1");

            expect(mockDb.select).toHaveBeenCalledTimes(2);
            expect(mockDb.select).toHaveBeenNthCalledWith(1, {
                courseCode: courseSections.courseCode,
                section: courseSections.section,
            });
            expect(mockDb.select).toHaveBeenNthCalledWith(2, {
                day: courseSectionSchedules.day,
                time: courseSectionSchedules.time,
                courseCode: courseSectionSchedules.courseCode,
                section: courseSectionSchedules.section,
                venueCode: courseSectionSchedules.venueCode,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(2);
            expect(mockDb.from).toHaveBeenNthCalledWith(1, courseSections);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                2,
                courseSectionSchedules
            );
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenNthCalledWith(
                1,
                expect.anything() as unknown
            );
            expect(mockDb.where).toHaveBeenNthCalledWith(
                2,
                expect.anything() as unknown
            );
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    columns: {
                        day: true,
                        time: true,
                    },
                    with: {
                        courseSection: {
                            columns: { section: true },
                            with: {
                                course: { columns: { code: true, name: true } },
                                lecturer: true,
                            },
                        },
                        venue: { columns: { shortName: true } },
                    },
                    where: expect.anything() as unknown,
                })
            );

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).toHaveBeenCalledAfter(mockDb.where);
        });
    });

    describe("searchByName", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByName("John Doe", 0)
            ).rejects.toThrow("Limit must be at least 1");
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByName("John Doe", 10, -1)
            ).rejects.toThrow("Offset must be at least 0");
        });

        it("Should query database", async () => {
            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockReturnValueOnce({
                        limit: mockDb.limit.mockReturnValueOnce({
                            offset: mockDb.offset.mockReturnValueOnce({
                                execute: mockDb.execute.mockResolvedValueOnce(
                                    []
                                ),
                            }),
                        }),
                    }),
                }),
            });

            const name = "John Doe";

            await repository.searchByName(name, 10, 0);

            expect(mockDb.select).toHaveBeenCalled();

            expect(mockDb.from).toHaveBeenCalledWith(lecturers);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalledWith(
                sql`MATCH(${lecturers.name}) AGAINST(${sql.placeholder("name")} IN BOOLEAN MODE)`
            );
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.limit).toHaveBeenCalledWith(10);
            expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.offset).toHaveBeenCalledWith(0);
            expect(mockDb.offset).toHaveBeenCalledAfter(mockDb.limit);

            expect(mockDb.execute).toHaveBeenCalledWith({
                name: name.split(" ").join("+ ").trim(),
            });
            expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.offset);
        });
    });
});
