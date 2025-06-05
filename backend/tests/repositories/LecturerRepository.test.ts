import { DrizzleDb } from "@/database";
import { dependencyTokens } from "@/dependencies/tokens";
import { LecturerRepository } from "@/repositories";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IRawTimetable,
} from "@/types";
import { createMockDb } from "../mocks";
import { createTestContainer } from "../setup/container";
import {
    cleanupSecondaryTables,
    seededPrimaryData,
    seeders,
} from "../setup/db";

describe("LecturerRepository (unit)", () => {
    let repository: LecturerRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new LecturerRepository(mockDb as unknown as DrizzleDb);
    });

    describe("searchByName", () => {
        it("Should throw an error if limit is lower than 1", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 0)
            ).rejects.toThrow("Limit must be at least 1");
        });

        it("Should throw an error if offset is lower than 0", async () => {
            await expect(async () =>
                repository.searchByName("2024/2025", 1, "John Doe", 10, -1)
            ).rejects.toThrow("Offset must be at least 0");
        });
    });
});

describe("LecturerRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.lecturerRepository);

    describe("getByWorkerNo", () => {
        it("Should return lecturer by worker number", async () => {
            const lecturer = seededPrimaryData.lecturers[0];

            const fetchedLecturer = await repository.getByWorkerNo(
                lecturer.workerNo
            );

            expect(fetchedLecturer).toEqual(lecturer);
        });

        it("Should return undefined if lecturer does not exist", async () => {
            const lecturer = await repository.getByWorkerNo(-1);

            expect(lecturer).toBeNull();
        });
    });

    describe("getTimetable", () => {
        const lecturer = seededPrimaryData.lecturers[0];
        const course = seededPrimaryData.courses[0];
        const session = seededPrimaryData.sessions[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const otherSession = seededPrimaryData.sessions[1];

            const [firstSection, secondSection] =
                await seeders.courseSection.seedMany(
                    {
                        session: session.session,
                        semester: session.semester,
                        courseCode: course.code,
                        section: "1",
                        lecturerNo: lecturer.workerNo,
                    },
                    // Should not be returned in the timetable.
                    {
                        session: otherSession.session,
                        semester: otherSession.semester,
                        courseCode: course.code,
                        section: "1",
                        lecturerNo: lecturer.workerNo,
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    courseCode: course.code,
                    section: firstSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    courseCode: course.code,
                    section: secondSection.section,
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.tuesday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                },
                // Should not be returned in the timetable.
                {
                    courseCode: course.code,
                    section: secondSection.section,
                    session: otherSession.session,
                    semester: otherSession.semester,
                    day: CourseSectionScheduleDay.wednesday,
                    time: CourseSectionScheduleTime.time4,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return lecturer timetable for the given academic session and semester", async () => {
            const timetable = await repository.getTimetable(
                lecturer.workerNo,
                session.session,
                session.semester
            );

            expect(timetable).toHaveLength(2);

            expect(timetable[0]).toEqual({
                courseCode: course.code,
                courseName: course.name,
                section: "1",
                lecturerName: lecturer.name,
                lecturerNo: lecturer.workerNo,
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                venueShortName: venue.code,
            } satisfies IRawTimetable);

            expect(timetable[1]).toEqual({
                courseCode: course.code,
                courseName: course.name,
                section: "1",
                lecturerName: lecturer.name,
                lecturerNo: lecturer.workerNo,
                scheduleDay: CourseSectionScheduleDay.tuesday,
                scheduleTime: CourseSectionScheduleTime.time3,
                venueShortName: venue.code,
            } satisfies IRawTimetable);
        });
    });

    describe("searchByName", () => {
        const session = seededPrimaryData.sessions[0];
        const lecturer = seededPrimaryData.lecturers[0];
        const course = seededPrimaryData.courses[0];

        beforeAll(async () => {
            const otherSession = seededPrimaryData.sessions[1];

            await seeders.courseSection.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: course.code,
                    section: "1",
                    lecturerNo: lecturer.workerNo,
                },
                // Should not be returned in the search.
                {
                    session: otherSession.session,
                    semester: otherSession.semester,
                    courseCode: course.code,
                    section: "1",
                    lecturerNo: lecturer.workerNo,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return lecturers matching the name", async () => {
            const lecturers = await repository.searchByName(
                session.session,
                session.semester,
                "Jane",
                10,
                0
            );

            expect(lecturers).toHaveLength(1);
            expect(lecturers[0]).toEqual(lecturer);
        });
    });
});
