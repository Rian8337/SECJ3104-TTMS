import { beforeEach, describe, expect, it } from "vitest";
import {
    IStudentRegisteredCourse,
    studentRegisteredCourses,
    students,
} from "../../src/database/schema";
import { StudentRepository } from "../../src/repositories";
import { ITimetable } from "../../src/types";
import { mockDb } from "../mocks";
import { sql } from "drizzle-orm";

describe("StudentRepository (unit)", () => {
    let repository: StudentRepository;

    beforeEach(() => {
        repository = new StudentRepository(mockDb);
    });

    it("[getByMatricNo] Should query database", async () => {
        mockDb.select.mockReturnValueOnce({
            from: mockDb.from.mockReturnValueOnce({
                where: mockDb.where.mockReturnValueOnce({
                    limit: mockDb.limit.mockResolvedValueOnce([]),
                }),
            }),
        });

        await repository.getByMatricNo("123456");

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledWith(students);
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
                    where: mockDb.where.mockReturnValueOnce([]),
                }),
            });

            await repository.getTimetable("123456", "2023/2024", "1");

            expect(mockDb.select).toHaveBeenCalledTimes(1);
            expect(mockDb.select).toHaveBeenCalledWith({
                courseCode: studentRegisteredCourses.courseCode,
                section: studentRegisteredCourses.section,
            });

            expect(mockDb.from).toHaveBeenCalledWith(studentRegisteredCourses);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalled();
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);
        });

        it("Should query database twice if there are registered courses", async () => {
            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockReturnValueOnce([
                        {
                            courseCode: "CS101",
                            section: "1",
                            matricNo: "123456",
                            session: "2023/2024",
                            semester: 1,
                        },
                    ] satisfies IStudentRegisteredCourse[]),
                }),
            });

            const mockTimetable = [
                {
                    day: 1,
                    time: 1,
                    courseSection: {
                        section: "1",
                        course: {
                            code: "CS101",
                            name: "Introduction to Computer Science",
                        },
                        lecturer: null,
                    },
                    venue: null,
                },
            ] satisfies ITimetable[];

            mockDb.query.courseSectionSchedules.findMany.mockResolvedValueOnce(
                mockTimetable
            );

            const timetable = await repository.getTimetable(
                "123456",
                "2023/2024",
                "1"
            );

            expect(mockDb.select).toHaveBeenCalledTimes(1);
            expect(mockDb.select).toHaveBeenCalledWith({
                courseCode: studentRegisteredCourses.courseCode,
                section: studentRegisteredCourses.section,
            });

            expect(mockDb.from).toHaveBeenCalledWith(studentRegisteredCourses);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).toHaveBeenCalledWith(
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
            ).toHaveBeenCalledTimes(1);

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).toHaveBeenCalledAfter(mockDb.from);

            expect(timetable).toEqual(mockTimetable);
        });
    });

    describe("searchByMatricNo", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByMatricNo("123456", 0)
            ).rejects.toThrow("Limit must be greater than 0");
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByMatricNo("123456", 10, -1)
            ).rejects.toThrow("Offset must be greater than or equal to 0");
        });

        it("Should query database", async () => {
            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockReturnValueOnce({
                        limit: mockDb.limit.mockReturnValueOnce({
                            offset: mockDb.offset.mockResolvedValueOnce([]),
                        }),
                    }),
                }),
            });

            const matricNo = "123456";

            await repository.searchByMatricNo(matricNo, 10, 0);

            expect(mockDb.select).toHaveBeenCalled();

            expect(mockDb.from).toHaveBeenCalledWith(students);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalledWith(
                sql`MATCH(${students.matricNo}) AGAINST(${"+" + matricNo} IN BOOLEAN MODE)`
            );
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.limit).toHaveBeenCalledWith(10);
            expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.offset).toHaveBeenCalledWith(0);
            expect(mockDb.offset).toHaveBeenCalledAfter(mockDb.limit);
        });
    });

    describe("searchByName", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByName("John Doe", 0)
            ).rejects.toThrow("Limit must be greater than 0");
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByName("John Doe", 10, -1)
            ).rejects.toThrow("Offset must be greater than or equal to 0");
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

            expect(mockDb.from).toHaveBeenCalledWith(students);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

            expect(mockDb.where).toHaveBeenCalledWith(
                sql`MATCH(${students.name}) AGAINST(${sql.placeholder("name")} IN BOOLEAN MODE)`
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
