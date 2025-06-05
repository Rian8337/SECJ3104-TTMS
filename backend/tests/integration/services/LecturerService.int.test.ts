import { ILecturer } from "@/database/schema";
import { dependencyTokens } from "@/dependencies/tokens";
import { FailedOperationResult, SuccessfulOperationResult } from "@/services";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    ITimetable,
    IVenueClashTimetable,
} from "@/types";
import {
    cleanupSecondaryTables,
    createTestContainer,
    seededPrimaryData,
    seeders,
} from "@test/setup";

describe("LecturerService (integration)", () => {
    const container = createTestContainer();
    const service = container.resolve(dependencyTokens.lecturerService);

    describe("getTimetable", () => {
        const session = seededPrimaryData.sessions[0];
        const course = seededPrimaryData.courses[0];
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
                    session: section.session,
                    semester: section.semester,
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    session: section.session,
                    semester: section.semester,
                    courseCode: section.courseCode,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return 404 if lecturer is not found", async () => {
            const result = (await service.getTimetable(
                654321,
                session.session,
                session.semester
            )) as FailedOperationResult;

            expect(result.isSuccessful()).toBe(false);
            expect(result.failed()).toBe(true);

            expect(result.status).toBe(404);
            expect(result.error).toBe("Lecturer not found");
        });

        it("Should get timetable for lecturer", async () => {
            const result = (await service.getTimetable(
                lecturer.workerNo,
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

    describe("getVenueClashes", () => {
        const session = seededPrimaryData.sessions[0];
        const course = seededPrimaryData.courses[0];
        const [lecturer, otherLecturer] = seededPrimaryData.lecturers;
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const [firstSection, secondSection] =
                await seeders.courseSection.seedMany(
                    {
                        courseCode: course.code,
                        section: "1",
                        session: session.session,
                        semester: session.semester,
                        lecturerNo: lecturer.workerNo,
                    },
                    {
                        courseCode: course.code,
                        section: "2",
                        session: session.session,
                        semester: session.semester,
                        lecturerNo: otherLecturer.workerNo,
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: firstSection.session,
                    semester: firstSection.semester,
                    courseCode: firstSection.courseCode,
                    section: firstSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                {
                    session: secondSection.session,
                    semester: secondSection.semester,
                    courseCode: secondSection.courseCode,
                    section: secondSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return 404 if lecturer is not found", async () => {
            const result = (await service.getVenueClashes(
                session.session,
                session.semester,
                654321
            )) as FailedOperationResult;

            expect(result.isSuccessful()).toBe(false);
            expect(result.failed()).toBe(true);

            expect(result.status).toBe(404);
            expect(result.error).toBe("Lecturer not found");
        });

        it("Should return venue clashes for lecturer", async () => {
            const result = (await service.getVenueClashes(
                session.session,
                session.semester,
                lecturer.workerNo
            )) as SuccessfulOperationResult<IVenueClashTimetable[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(1);

            expect(result.data[0]).toStrictEqual({
                day: CourseSectionScheduleDay.monday,
                time: CourseSectionScheduleTime.time2,
                venue: { shortName: venue.shortName },
                courseSections: [
                    {
                        course: {
                            code: course.code,
                            name: course.name,
                        },
                        lecturer,
                        section: "1",
                    },
                ],
            } satisfies IVenueClashTimetable);
        });
    });

    describe("search", () => {
        const session = seededPrimaryData.sessions[0];
        const lecturer = seededPrimaryData.lecturers[0];

        beforeAll(async () => {
            const course = seededPrimaryData.courses[0];

            await seeders.courseSection.seedOne({
                courseCode: course.code,
                section: "1",
                session: session.session,
                semester: session.semester,
                lecturerNo: lecturer.workerNo,
            });
        });

        afterAll(cleanupSecondaryTables);

        it("Should return empty result if no match is found", async () => {
            const result = (await service.search(
                session.session,
                session.semester,
                "NonExistentName"
            )) as SuccessfulOperationResult<ILecturer[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(0);
        });

        it("Should return empty result if lecturer is not in offset range", async () => {
            const result = (await service.search(
                session.session,
                session.semester,
                lecturer.name,
                1,
                10
            )) as SuccessfulOperationResult<ILecturer[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(0);
        });

        it("Should search by name", async () => {
            const result = (await service.search(
                session.session,
                session.semester,
                lecturer.name.split(" ")[1],
                1,
                0
            )) as SuccessfulOperationResult<ILecturer[]>;

            expect(result.isSuccessful()).toBe(true);
            expect(result.failed()).toBe(false);

            expect(result.data).toBeInstanceOf(Array);
            expect(result.data).toHaveLength(1);

            expect(result.data[0]).toStrictEqual({
                workerNo: lecturer.workerNo,
                name: lecturer.name,
            } satisfies ILecturer);
        });
    });
});
