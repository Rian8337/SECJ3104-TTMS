import { DrizzleDb } from "@/database";
import { venues } from "@/database/schema";
import { dependencyTokens } from "@/dependencies/tokens";
import { VenueRepository } from "@/repositories";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IRawVenueClashTimetable,
} from "@/types";
import { createMockDb } from "../mocks";
import { createTestContainer } from "../setup/container";
import {
    cleanupSecondaryTables,
    seededPrimaryData,
    seeders,
} from "../setup/db";

describe("VenueRepository (unit)", () => {
    let repository: VenueRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();

        repository = new VenueRepository(mockDb as unknown as DrizzleDb);
    });

    it("[getByCode] Should call database", async () => {
        mockDb.limit.mockResolvedValueOnce([]);

        await repository.getByCode("");

        expect(mockDb.select).toHaveBeenCalled();

        expect(mockDb.from).toHaveBeenCalledWith(venues);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);

        expect(mockDb.where).toHaveBeenCalled();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.from);

        expect(mockDb.limit).toHaveBeenCalledWith(1);
        expect(mockDb.limit).toHaveBeenCalledAfter(mockDb.where);
    });

    it("[getVenueClashes] Should call database", async () => {
        await repository.getVenueClashes("2024/2025", 2);

        expect(mockDb.selectDistinct).toHaveBeenCalledOnce();

        expect(mockDb.from).toHaveBeenCalledOnce();
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.selectDistinct);

        expect(mockDb.innerJoin).toHaveBeenCalledTimes(4);
        expect(mockDb.leftJoin).toHaveBeenCalledOnce();

        expect(mockDb.where).toHaveBeenCalledOnce();
        expect(mockDb.where).toHaveBeenCalledAfter(mockDb.innerJoin);

        expect(mockDb.orderBy).toHaveBeenCalledOnce();
        expect(mockDb.orderBy).toHaveBeenCalledAfter(mockDb.where);

        expect(mockDb.execute).toHaveBeenCalledOnce();
        expect(mockDb.execute).toHaveBeenCalledAfter(mockDb.orderBy);
    });
});

describe("VenueRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.venueRepository);

    describe("getByCode", () => {
        it("Should return null if venue does not exist", async () => {
            const result = await repository.getByCode("NON_EXISTENT_VENUE");

            expect(result).toBeNull();
        });

        it("Should return venue if it exists", async () => {
            const fetchedVenue = await repository.getByCode("VENUE_101");

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

            expect(clashes[0]).toEqual({
                courseCode: firstCourse.code,
                courseName: firstCourse.name,
                lecturerName: firstLecturer.name,
                lecturerNo: firstLecturer.workerNo,
                section: "1",
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                scheduleVenue: venue.code,
            } satisfies IRawVenueClashTimetable);
        });
    });
});
