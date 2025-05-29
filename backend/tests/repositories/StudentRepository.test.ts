import { beforeEach, describe, expect, it } from "vitest";
import {
    IStudentRegisteredCourse,
    studentRegisteredCourses,
    students,
} from "../../src/database/schema";
import { StudentRepository } from "../../src/repositories";
import { ITimetable } from "../../src/types";
import { mockDb } from "../mocks";
import { and, eq, sql } from "drizzle-orm";

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

            expect(
                mockDb.query.courseSectionSchedules.findMany
            ).not.toHaveBeenCalled();
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
            ).toHaveBeenCalledAfter(mockDb.from);

            expect(timetable).toEqual(mockTimetable);
        });
    });

    describe("searchByMatricNo", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByMatricNo("2024/2025", 1, "123456", 0)
            ).rejects.toThrow("Limit must be greater than 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByMatricNo("2024/2025", 1, "123456", 10, -1)
            ).rejects.toThrow("Offset must be greater than or equal to 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });

        it("Should only query database once if there are no registered students", async () => {
            mockDb.selectDistinct.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockResolvedValueOnce([]),
                }),
            });

            await repository.searchByMatricNo("2024/2025", 1, "123456", 10, 0);

            expect(mockDb.selectDistinct).toHaveBeenCalledExactlyOnceWith({
                matricNo: studentRegisteredCourses.matricNo,
            });

            expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(
                studentRegisteredCourses
            );
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.selectDistinct);

            expect(mockDb.where).toHaveBeenCalledExactlyOnceWith(
                and(
                    eq(studentRegisteredCourses.session, "2024/2025"),
                    eq(studentRegisteredCourses.semester, 1)
                )
            );
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);
        });

        it("Should query database with search term", async () => {
            mockDb.selectDistinct.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockResolvedValueOnce([
                        { matricNo: "123456" },
                    ]),
                }),
            });

            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    as: mockDb.as,
                }),
            });

            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockReturnValueOnce({
                        orderBy: mockDb.orderBy.mockReturnValueOnce({
                            execute: mockDb.execute.mockResolvedValueOnce([
                                {
                                    matricNo: "123456",
                                    name: "Test name",
                                    courseCode: "SECVH",
                                    relevance: 1,
                                },
                            ]),
                        }),
                    }),
                }),
            });

            await repository.searchByMatricNo("2024/2025", 1, "123456", 10, 0);

            expect(mockDb.selectDistinct).toHaveBeenCalled();
            expect(mockDb.selectDistinct).toHaveBeenCalledWith({
                matricNo: studentRegisteredCourses.matricNo,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(3);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                1,
                studentRegisteredCourses
            );
            expect(mockDb.from).toHaveBeenNthCalledWith(2, students);

            expect(mockDb.as).toHaveBeenCalledWith("sub");
            expect(mockDb.as).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.where).toHaveBeenNthCalledWith(
                1,
                and(
                    eq(studentRegisteredCourses.session, "2024/2025"),
                    eq(studentRegisteredCourses.semester, 1)
                )
            );
            expect(mockDb.where).toHaveBeenNthCalledWith(
                2,
                sql`sub.relevance > 0`
            );

            expect(mockDb.orderBy).toHaveBeenCalledWith(
                sql`sub.relevance DESC`
            );
            expect(mockDb.orderBy).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.execute).toHaveBeenCalledWith({
                matricNo: "+123456*",
            });
            expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.orderBy);

            expect(mockDb.select).toHaveBeenCalledWith({
                matricNo: students.matricNo,
                name: students.name,
                courseCode: students.courseCode,
                relevance:
                    sql`MATCH(${students.matricNo}) AGAINST(${sql.placeholder("matricNo")} IN BOOLEAN MODE)`.as(
                        "relevance"
                    ),
            });
        });
    });

    describe("searchByName", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 0)
            ).rejects.toThrow("Limit must be greater than 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 10, -1)
            ).rejects.toThrow("Offset must be greater than or equal to 0");

            expect(mockDb.select).not.toHaveBeenCalled();
        });

        it("Should only query database once if there are no registered students", async () => {
            mockDb.selectDistinct.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockResolvedValueOnce([]),
                }),
            });

            await repository.searchByMatricNo("2024/2025", 1, "123456", 10, 0);

            expect(mockDb.selectDistinct).toHaveBeenCalledExactlyOnceWith({
                matricNo: studentRegisteredCourses.matricNo,
            });

            expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(
                studentRegisteredCourses
            );
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.selectDistinct);

            expect(mockDb.where).toHaveBeenCalledExactlyOnceWith(
                and(
                    eq(studentRegisteredCourses.session, "2024/2025"),
                    eq(studentRegisteredCourses.semester, 1)
                )
            );
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);
        });

        it("Should query database with search term", async () => {
            mockDb.selectDistinct.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockResolvedValueOnce([
                        { matricNo: "123456" },
                    ]),
                }),
            });

            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    as: mockDb.as,
                }),
            });

            mockDb.select.mockReturnValueOnce({
                from: mockDb.from.mockReturnValueOnce({
                    where: mockDb.where.mockReturnValueOnce({
                        orderBy: mockDb.orderBy.mockReturnValueOnce({
                            execute: mockDb.execute.mockResolvedValueOnce([
                                {
                                    matricNo: "123456",
                                    name: "Test name",
                                    courseCode: "SECVH",
                                    relevance: 1,
                                },
                            ]),
                        }),
                    }),
                }),
            });

            const name = "John Doe";

            await repository.searchByName("2024/2025", 1, name, 10, 0);

            expect(mockDb.selectDistinct).toHaveBeenCalled();
            expect(mockDb.selectDistinct).toHaveBeenCalledWith({
                matricNo: studentRegisteredCourses.matricNo,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(3);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                1,
                studentRegisteredCourses
            );
            expect(mockDb.from).toHaveBeenNthCalledWith(2, students);

            expect(mockDb.as).toHaveBeenCalledWith("sub");
            expect(mockDb.as).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.where).toHaveBeenNthCalledWith(
                1,
                and(
                    eq(studentRegisteredCourses.session, "2024/2025"),
                    eq(studentRegisteredCourses.semester, 1)
                )
            );
            expect(mockDb.where).toHaveBeenNthCalledWith(
                2,
                sql`sub.relevance > 0`
            );

            expect(mockDb.orderBy).toHaveBeenCalledWith(
                sql`sub.relevance DESC`
            );
            expect(mockDb.orderBy).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.execute).toHaveBeenCalledWith({
                name: "+JOHN* +DOE*",
            });
            expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.orderBy);

            expect(mockDb.select).toHaveBeenCalledWith({
                matricNo: students.matricNo,
                name: students.name,
                courseCode: students.courseCode,
                relevance:
                    sql`MATCH(${students.name}) AGAINST(${sql.placeholder("name")} IN BOOLEAN MODE)`.as(
                        "relevance"
                    ),
            });
        });
    });
});
