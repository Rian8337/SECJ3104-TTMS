import { dependencyTokens } from "@/dependencies/tokens";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IRawTimetable,
} from "@/types";
import {
    cleanupSecondaryTables,
    createTestContainer,
    seededPrimaryData,
    seeders,
} from "@test/setup";

describe("VenueRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.venueRepository);

    describe("getByCode", () => {
        it("Should return null if venue does not exist", async () => {
            const result = await repository.getByCode("NON_EXISTENT_VENUE");

            expect(result).toBeNull();
        });

        it("Should return venue if it exists", async () => {
            const fetchedVenue = await repository.getByCode("N28-VN-101");

            expect(fetchedVenue).toEqual(seededPrimaryData.venues[0]);
        });
    });

    describe("getVenueClashes", () => {
        const session = seededPrimaryData.sessions[0];
        const [firstLecturer, secondLecturer, thirdLecturer] =
            seededPrimaryData.lecturers;

        const [firstCourse, secondCourse] = seededPrimaryData.courses;
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const [firstSection, secondSection, thirdSection] =
                await seeders.courseSection.seedMany(
                    {
                        session: session.session,
                        semester: session.semester,
                        courseCode: firstCourse.code,
                        section: "1",
                        lecturerNo: firstLecturer.workerNo,
                    },
                    {
                        session: session.session,
                        semester: session.semester,
                        courseCode: secondCourse.code,
                        section: "1",
                        lecturerNo: secondLecturer.workerNo,
                    },
                    {
                        session: session.session,
                        semester: session.semester,
                        courseCode: firstCourse.code,
                        section: "2",
                        lecturerNo: thirdLecturer.workerNo,
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: firstSection.courseCode,
                    section: firstSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                // Clashes with SECJ1013 section 1
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: secondSection.courseCode,
                    section: secondSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                // Clashes with SECJ1013 section 2
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: secondSection.courseCode,
                    section: secondSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                },
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: thirdSection.courseCode,
                    section: thirdSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return clashes for a given academic session and semester", async () => {
            const clashes = await repository.getVenueClashes(
                session.session,
                session.semester
            );

            // 4 since all sections clash
            expect(clashes).toHaveLength(4);
        });

        it("Should return clashes for a given lecturer", async () => {
            const clashes = await repository.getVenueClashes(
                session.session,
                session.semester,
                seededPrimaryData.lecturers[0].workerNo
            );

            expect(clashes).toHaveLength(1);

            expect(clashes[0]).toStrictEqual({
                courseCode: firstCourse.code,
                courseName: firstCourse.name,
                lecturerName: firstLecturer.name,
                lecturerNo: firstLecturer.workerNo,
                section: "1",
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                venueShortName: venue.shortName,
            } satisfies IRawTimetable);
        });
    });

    describe("getAvailableVenues", () => {
        const session = seededPrimaryData.sessions[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const otherSession = seededPrimaryData.sessions[1];
            const course = seededPrimaryData.courses[0];

            const [section, otherSection] =
                await seeders.courseSection.seedMany(
                    {
                        session: session.session,
                        semester: session.semester,
                        courseCode: course.code,
                        section: "1",
                    },
                    // Should not be included in the results
                    {
                        session: otherSession.session,
                        semester: otherSession.semester,
                        courseCode: course.code,
                        section: "1",
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
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
                },
                {
                    session: otherSection.session,
                    semester: otherSection.semester,
                    courseCode: otherSection.courseCode,
                    section: otherSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time4,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return available venues for a given academic session and semester", async () => {
            const availableVenues = await repository.getAvailableVenues(
                session.session,
                session.semester,
                CourseSectionScheduleDay.monday,
                [CourseSectionScheduleTime.time4]
            );

            expect(availableVenues).toHaveLength(2);
            expect(availableVenues[0]).toStrictEqual(venue);
            expect(availableVenues[1]).toStrictEqual(
                seededPrimaryData.venues[1]
            );
        });
    });
});
