import { DrizzleDb } from "@/database";
import { studentRegisteredCourses, students } from "@/database/schema";
import { dependencyTokens } from "@/dependencies/tokens";
import { StudentRepository } from "@/repositories";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IRawTimetable,
} from "@/types";
import { sql } from "drizzle-orm";
import { createMockDb } from "../mocks";
import { createTestContainer } from "../setup/container";
import {
    cleanupSecondaryTables,
    seededPrimaryData,
    seeders,
} from "../setup/db";

describe("StudentRepository (unit)", () => {
    let repository: StudentRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new StudentRepository(mockDb as unknown as DrizzleDb);
    });

    it("[getByMatricNo] Should query database", async () => {
        mockDb.limit.mockResolvedValueOnce([]);

        await repository.getByMatricNo("123456");

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(students);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.where).toHaveBeenCalledOnce();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

        expect(mockDb.limit).toHaveBeenCalledExactlyOnceWith(1);
        expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);
    });

    describe("getTimetable", () => {
        it("Should query database", async () => {
            await repository.getTimetable("123456", "2023/2024", 1);

            expect(mockDb.select).toHaveBeenCalledOnce();
            expect(mockDb.from).toHaveBeenCalledOnce();
            expect(mockDb.innerJoin).toHaveBeenCalledTimes(3);
            expect(mockDb.leftJoin).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenCalledOnce();
            expect(mockDb.orderBy).toHaveBeenCalledOnce();
            expect(mockDb.execute).toHaveBeenCalledOnce();
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

        it("Should query database with matric number match expression", async () => {
            await repository.searchByMatricNo("2024/2025", 1, "123456", 10, 0);

            expect(mockDb.select).toHaveBeenCalledTimes(2);
            expect(mockDb.select).toHaveBeenNthCalledWith(1, {
                matricNo: students.matricNo,
                name: students.name,
                courseCode: students.courseCode,
            });
            expect(mockDb.select).toHaveBeenNthCalledWith(2, {
                exists: sql`1`,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(2);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
            expect(mockDb.from).toHaveBeenNthCalledWith(1, students);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                2,
                studentRegisteredCourses
            );

            expect(mockDb.where).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.limit).toHaveBeenCalledExactlyOnceWith(10);
            expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.offset).toHaveBeenCalledExactlyOnceWith(0);
            expect(mockDb.offset).toHaveBeenCalledAfter(mockDb.limit);
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

        it("Should query database with name match expression", async () => {
            mockDb.execute.mockResolvedValue([]);

            await repository.searchByName("2024/2025", 1, "John Doe", 10, 0);

            expect(mockDb.select).toHaveBeenCalledTimes(3);
            expect(mockDb.select).toHaveBeenNthCalledWith(3, {
                exists: sql`1`,
            });

            expect(mockDb.from).toHaveBeenCalledTimes(3);
            expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
            expect(mockDb.from).toHaveBeenNthCalledWith(1, students);
            expect(mockDb.from).toHaveBeenNthCalledWith(
                3,
                studentRegisteredCourses
            );

            expect(mockDb.where).toHaveBeenCalledTimes(2);
            expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

            expect(mockDb.orderBy).toHaveBeenCalledOnce();
            expect(mockDb.orderBy).toHaveBeenCalledAfter(mockDb.where);

            expect(mockDb.limit).toHaveBeenCalledExactlyOnceWith(10);
            expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.orderBy);

            expect(mockDb.offset).toHaveBeenCalledExactlyOnceWith(0);
            expect(mockDb.offset).toHaveBeenCalledAfter(mockDb.limit);

            expect(mockDb.execute).toHaveBeenCalledExactlyOnceWith({
                name: "+JOHN* +DOE*",
            });
            expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.offset);
        });
    });
});

describe("StudentRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.studentRepository);

    describe("getByMatricNo", () => {
        it("Should return null if student does not exist", async () => {
            const student = await repository.getByMatricNo(
                "NON_EXISTENT_MATRIC"
            );

            expect(student).toBeNull();
        });

        it("Should return student if it exists", async () => {
            const student = seededPrimaryData.students[0];
            const result = await repository.getByMatricNo(student.matricNo);

            expect(result).toEqual(student);
        });
    });

    describe("getTimetable", () => {
        const firstSession = seededPrimaryData.sessions[0];
        const student = seededPrimaryData.students[0];
        const lecturer = seededPrimaryData.lecturers[0];
        const course = seededPrimaryData.courses[0];

        beforeAll(async () => {
            const [firstSection, secondSection] =
                await seeders.courseSection.seedMany(
                    {
                        session: firstSession.session,
                        semester: firstSession.semester,
                        courseCode: course.code,
                        section: "1",
                        lecturerNo: lecturer.workerNo,
                    },
                    {
                        session: firstSession.session,
                        semester: firstSession.semester,
                        courseCode: course.code,
                        section: "2",
                        lecturerNo: lecturer.workerNo,
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: firstSection.session,
                    semester: firstSection.semester,
                    courseCode: course.code,
                    section: firstSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                },
                {
                    session: firstSection.session,
                    semester: firstSection.semester,
                    courseCode: course.code,
                    section: firstSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                },
                // Should not be included in the timetable since it's a different session and semester.
                {
                    session: secondSection.session,
                    semester: secondSection.semester,
                    courseCode: course.code,
                    section: secondSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                }
            );

            await seeders.studentRegisteredCourse.seedMany({
                session: firstSession.session,
                semester: firstSession.semester,
                courseCode: course.code,
                section: firstSection.section,
                matricNo: student.matricNo,
            });
        });

        afterAll(cleanupSecondaryTables);

        it("Should return student timetable for the given academic session and semester", async () => {
            const timetable = await repository.getTimetable(
                student.matricNo,
                firstSession.session,
                firstSession.semester
            );

            expect(timetable).toHaveLength(2);

            expect(timetable[0]).toEqual({
                courseCode: course.code,
                courseName: course.name,
                section: "1",
                lecturerNo: lecturer.workerNo,
                lecturerName: lecturer.name,
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                venueShortName: null,
            } satisfies IRawTimetable);

            expect(timetable[1]).toEqual({
                courseCode: course.code,
                courseName: course.name,
                section: "1",
                lecturerNo: lecturer.workerNo,
                lecturerName: lecturer.name,
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time3,
                venueShortName: null,
            } satisfies IRawTimetable);
        });
    });

    describe("Search student", () => {
        const [firstStudent, secondStudent] = seededPrimaryData.students;
        const [firstSession, secondSession] = seededPrimaryData.sessions;
        const course = seededPrimaryData.courses[0];

        beforeAll(async () => {
            const [section] = await seeders.courseSection.seedMany(
                {
                    session: firstSession.session,
                    semester: firstSession.semester,
                    courseCode: course.code,
                    section: "1",
                },
                {
                    session: secondSession.session,
                    semester: secondSession.semester,
                    courseCode: course.code,
                    section: "1",
                }
            );

            await seeders.studentRegisteredCourse.seedMany(
                {
                    session: firstSession.session,
                    semester: firstSession.semester,
                    courseCode: course.code,
                    section: section.section,
                    matricNo: firstStudent.matricNo,
                },
                {
                    session: secondSession.session,
                    semester: secondSession.semester,
                    courseCode: course.code,
                    section: section.section,
                    matricNo: secondStudent.matricNo,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        describe("searchByMatricNo", () => {
            it("Should return empty array if no student matches", async () => {
                const results = await repository.searchByMatricNo(
                    firstSession.session,
                    firstSession.semester,
                    "NON_EXISTENT_MATRIC",
                    10,
                    0
                );

                expect(results).toHaveLength(0);
            });

            it("Should return student matching matric number for the given academic session and semester", async () => {
                const results = await repository.searchByMatricNo(
                    firstSession.session,
                    firstSession.semester,
                    firstStudent.matricNo,
                    10,
                    0
                );

                expect(results).toHaveLength(1);
            });
        });

        describe("searchByNmae", () => {
            it("Should return empty array if no student matches", async () => {
                const results = await repository.searchByName(
                    firstSession.session,
                    firstSession.semester,
                    "Non Existent",
                    10,
                    0
                );

                expect(results).toHaveLength(0);
            });

            it("Should return student matching name for the given academic session and semester", async () => {
                const results = await repository.searchByName(
                    firstSession.session,
                    firstSession.semester,
                    "John",
                    10,
                    0
                );

                expect(results).toHaveLength(1);
            });
        });
    });
});
