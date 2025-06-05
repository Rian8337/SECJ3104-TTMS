import { dependencyTokens } from "@/dependencies/tokens";
import {
    FailedOperationResult,
    StudentService,
    SuccessfulOperationResult,
} from "@/services";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IStudentSearchEntry,
    ITimetable,
} from "@/types";
import { mockStudentRepository } from "../mocks";
import { createTestContainer } from "../setup/container";
import {
    cleanupSecondaryTables,
    seededPrimaryData,
    seeders,
} from "../setup/db";

describe("StudentService (unit)", () => {
    let service: StudentService;

    beforeEach(() => {
        service = new StudentService(mockStudentRepository);
    });

    it("[getByMatricNo] should get student by matric number from repository", async () => {
        await service.getByMatricNo("A12345678");

        expect(mockStudentRepository.getByMatricNo).toHaveBeenCalledWith(
            "A12345678"
        );
    });

    describe("getTimetable", () => {
        it("Should return error for non-existent student timetable", async () => {
            mockStudentRepository.getByMatricNo.mockResolvedValueOnce(null);

            const result = await service.getTimetable(
                "C0000000",
                "2023/2024",
                1
            );

            const failedResult = result as FailedOperationResult;

            expect(result.isSuccessful()).toBe(false);
            expect(result.failed()).toBe(true);

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
            const result = await service.search("2024/2025", 1, "AB", 10, 0);
            const failedResult = result as FailedOperationResult;

            expect(result.isSuccessful()).toBe(false);
            expect(result.failed()).toBe(true);

            expect(result.status).toBe(400);
            expect(failedResult.error).toBe(
                "Query must be at least 3 characters long"
            );

            expect(
                mockStudentRepository.searchByMatricNo
            ).not.toHaveBeenCalled();

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should return empty result for an invalid matric number", async () => {
            const result = await service.search(
                "2024/2025",
                1,
                "A1234567",
                10,
                0
            );

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(
                mockStudentRepository.searchByMatricNo
            ).not.toHaveBeenCalled();

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should search by matric number", async () => {
            const result = await service.search("2024/2025", 1, "A12FS5678");

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(mockStudentRepository.searchByMatricNo).toHaveBeenCalledWith(
                "2024/2025",
                1,
                "A12FS5678",
                10,
                0
            );

            expect(mockStudentRepository.searchByName).not.toHaveBeenCalled();
        });

        it("Should search by name", async () => {
            const result = await service.search("2024/2025", 1, "Jane", 10, 0);

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(mockStudentRepository.searchByName).toHaveBeenCalledWith(
                "2024/2025",
                1,
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

describe("StudentService (integration)", () => {
    const container = createTestContainer();
    const service = container.resolve(dependencyTokens.studentService);

    describe("getTimetable", () => {
        const session = seededPrimaryData.sessions[0];
        const course = seededPrimaryData.courses[0];
        const student = seededPrimaryData.students[0];
        const lecturer = seededPrimaryData.lecturers[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const section = await seeders.courseSection.seedOne({
                courseCode: course.code,
                section: "1",
                session: session.session,
                semester: session.semester,
                lecturerNo: lecturer.workerNo,
            });

            await seeders.courseSectionSchedule.seedMany(
                {
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    session: section.session,
                    semester: section.semester,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    session: section.session,
                    semester: section.semester,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );

            await seeders.studentRegisteredCourse.seedOne({
                matricNo: student.matricNo,
                courseCode: section.courseCode,
                section: section.section,
                session: section.session,
                semester: section.semester,
            });
        });

        afterAll(cleanupSecondaryTables);

        it("Should get timetable for student", async () => {
            const result = (await service.getTimetable(
                student.matricNo,
                session.session,
                session.semester
            )) as SuccessfulOperationResult<ITimetable[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(2);

            expect(result.data[0]).toStrictEqual({
                courseSection: {
                    course: {
                        code: course.code,
                        name: course.name,
                    },
                    lecturer,
                    section: "1",
                },
                day: CourseSectionScheduleDay.monday,
                time: CourseSectionScheduleTime.time2,
                venue: { shortName: venue.shortName },
            } satisfies ITimetable);

            expect(result.data[1]).toStrictEqual({
                courseSection: {
                    course: {
                        code: course.code,
                        name: course.name,
                    },
                    lecturer,
                    section: "1",
                },
                day: CourseSectionScheduleDay.monday,
                time: CourseSectionScheduleTime.time3,
                venue: { shortName: venue.shortName },
            } satisfies ITimetable);
        });
    });

    describe("search", () => {
        const session = seededPrimaryData.sessions[0];
        const student = seededPrimaryData.students[0];

        beforeAll(async () => {
            const lecturer = seededPrimaryData.lecturers[0];
            const course = seededPrimaryData.courses[0];

            const section = await seeders.courseSection.seedOne({
                courseCode: course.code,
                section: "1",
                session: session.session,
                semester: session.semester,
                lecturerNo: lecturer.workerNo,
            });

            await seeders.studentRegisteredCourse.seedOne({
                matricNo: student.matricNo,
                courseCode: section.courseCode,
                section: section.section,
                session: section.session,
                semester: section.semester,
            });
        });

        afterAll(cleanupSecondaryTables);

        it("Should return empty result if no match is found", async () => {
            const result = (await service.search(
                session.session,
                session.semester,
                "NonExistentStudent"
            )) as SuccessfulOperationResult<IStudentSearchEntry[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(0);
        });

        it("Should return empty if student is not in offset range", async () => {
            const result = (await service.search(
                session.session,
                session.semester,
                student.name,
                1,
                10
            )) as SuccessfulOperationResult<IStudentSearchEntry[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(0);
        });

        it("Should search by matric number", async () => {
            const result = (await service.search(
                session.session,
                session.semester,
                student.matricNo
            )) as SuccessfulOperationResult<IStudentSearchEntry[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toStrictEqual({
                courseCode: student.courseCode,
                matricNo: student.matricNo,
                name: student.name,
            } satisfies IStudentSearchEntry);
        });

        it("Should search by name", async () => {
            const result = (await service.search(
                session.session,
                session.semester,
                student.name.split(" ")[0]
            )) as SuccessfulOperationResult<IStudentSearchEntry[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toStrictEqual({
                courseCode: student.courseCode,
                matricNo: student.matricNo,
                name: student.name,
            } satisfies IStudentSearchEntry);
        });
    });
});
