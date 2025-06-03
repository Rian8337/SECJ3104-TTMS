import { DrizzleDb } from "@/database";
import { venues, VenueType } from "@/database/schema";
import { dependencyTokens } from "@/dependencies/tokens";
import { VenueRepository } from "@/repositories";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IRawVenueClashTimetable,
} from "@/types";
import { createMockDb } from "../mocks";
import { setupTestContainer } from "../setup/container";
import { seeders } from "../setup/db";

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
    const container = setupTestContainer();
    const repository = container.resolve(dependencyTokens.venueRepository);

    describe("getByCode", () => {
        it("Should return null if venue does not exist", async () => {
            const result = await repository.getByCode("NON_EXISTENT_VENUE");

            expect(result).toBeNull();
        });

        it("Should return venue if it exists", async () => {
            const venue = await seeders.venue.seedOne({
                code: "VENUE_101",
                capacity: 100,
                name: "Venue 101",
                shortName: "V101",
                type: VenueType.laboratory,
            });

            const fetchedVenue = await repository.getByCode("VENUE_101");

            expect(fetchedVenue).toEqual(venue);
        });
    });

    describe("getVenueClashes", () => {
        beforeEach(async () => {
            const session = await seeders.session.seedOne({
                session: "2024/2025",
                semester: 2,
                startDate: new Date("2024-01-01"),
                endDate: new Date("2025-06-30"),
            });

            await seeders.course.seedMany(
                {
                    code: "SECJ1013",
                    name: "Programming Technique 1",
                    credits: 3,
                },
                {
                    code: "SECJ1023",
                    name: "Programming Technique 2",
                    credits: 3,
                }
            );

            await seeders.lecturer.seedMany(
                { workerNo: 1, name: "Dr. John Doe" },
                { workerNo: 2, name: "Dr. Jane Smith" },
                { workerNo: 3, name: "Dr. Alice Johnson" }
            );

            const venue = await seeders.venue.seedOne({
                code: "VENUE_101",
                capacity: 100,
                name: "Venue 101",
                shortName: "V101",
                type: VenueType.laboratory,
            });

            await seeders.courseSection.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: "SECJ1013",
                    section: "1",
                    lecturerNo: 1,
                },
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: "SECJ1023",
                    section: "1",
                    lecturerNo: 2,
                },
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: "SECJ1013",
                    section: "2",
                    lecturerNo: 3,
                }
            );

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: "SECJ1013",
                    section: "1",
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                // Clashes with SECJ1013 section 1
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: "SECJ1023",
                    section: "1",
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                // Clashes with SECJ1013 section 2
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: "SECJ1023",
                    section: "1",
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                },
                {
                    session: session.session,
                    semester: session.semester,
                    courseCode: "SECJ1013",
                    section: "2",
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );
        });

        it("Should return clashes for a given academic session and semester", async () => {
            const clashes = await repository.getVenueClashes("2024/2025", 2);

            // 4 since all sections clash
            expect(clashes).toHaveLength(4);
        });

        it("Should return clashes for a given lecturer", async () => {
            const clashes = await repository.getVenueClashes("2024/2025", 2, 1);

            expect(clashes).toHaveLength(1);

            expect(clashes[0]).toEqual({
                courseCode: "SECJ1013",
                courseName: "Programming Technique 1",
                lecturerName: "Dr. John Doe",
                lecturerNo: 1,
                section: "1",
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                scheduleVenue: "VENUE_101",
            } satisfies IRawVenueClashTimetable);
        });
    });
});
