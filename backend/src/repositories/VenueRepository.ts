import { DrizzleDb } from "@/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
    IVenue,
    lecturers,
    venues,
    VenueType,
} from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IRawVenueClashTimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import {
    and,
    asc,
    eq,
    gt,
    inArray,
    isNotNull,
    like,
    ne,
    notExists,
    or,
    sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { inject } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IVenueRepository } from "./IVenueRepository";

/**
 * A repository that is responsible for handling venue-related operations.
 */
@Repository(dependencyTokens.venueRepository)
export class VenueRepository
    extends BaseRepository
    implements IVenueRepository
{
    constructor(@inject(dependencyTokens.drizzleDb) db: DrizzleDb) {
        super(db);
    }

    getByCode(code: string): Promise<IVenue | null> {
        return this.db
            .select()
            .from(venues)
            .where(eq(venues.code, code))
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    getVenueClashes(
        session: TTMSSession,
        semester: TTMSSemester,
        workerNo?: number
    ): Promise<IRawVenueClashTimetable[]> {
        // Primary course section of the lecturer.
        const cs1 = alias(courseSections, "cs1");

        // Another course section that clash with the primary course section.
        const cs2 = alias(courseSections, "cs2");

        // Course section schedules of the primary course section.
        const css1 = alias(courseSectionSchedules, "css1");

        // Course section schedules of the clashing course section.
        const css2 = alias(courseSectionSchedules, "css2");

        const l = alias(lecturers, "l");
        const c = alias(courses, "c");
        const v = alias(venues, "v");

        return (
            this.db
                .selectDistinct({
                    section: cs1.section,
                    courseCode: cs1.courseCode,
                    lecturerNo: cs1.lecturerNo,
                    lecturerName: l.name,
                    courseName: c.name,
                    scheduleDay: css1.day,
                    scheduleTime: css1.time,
                    scheduleVenue: v.shortName,
                })
                .from(cs1)
                // Get all schedules of the primary course section.
                .innerJoin(
                    css1,
                    and(
                        eq(css1.session, cs1.session),
                        eq(css1.semester, cs1.semester),
                        eq(css1.courseCode, cs1.courseCode),
                        eq(css1.section, cs1.section)
                    )
                )
                // Self-join to look for clashing schedules in the same academic session, semester,
                // day, time, and venue, but for a different course section.
                .innerJoin(
                    css2,
                    and(
                        eq(css1.session, css2.session),
                        eq(css1.semester, css2.semester),
                        eq(css1.day, css2.day),
                        eq(css1.time, css2.time),
                        eq(css1.venueCode, css2.venueCode),
                        or(
                            ne(css1.courseCode, css2.courseCode),
                            ne(css1.section, css2.section)
                        )
                    )
                )
                // Obtain the course section that clashes with the primary course section.
                .innerJoin(
                    cs2,
                    and(
                        eq(css2.session, cs2.session),
                        eq(css2.semester, cs2.semester),
                        eq(css2.courseCode, cs2.courseCode),
                        eq(css2.section, cs2.section)
                    )
                )
                // Left join to get the lecturer's name (if available).
                .leftJoin(l, eq(l.workerNo, cs1.lecturerNo))
                // Join to get the course name.
                .innerJoin(c, eq(c.code, cs1.courseCode))
                // Left join to get the venue's short name (if available).
                .leftJoin(v, eq(v.code, css1.venueCode))
                // Filter the results to the current academic session and semester, and exclude
                // the lecturer's own course sections.
                .where(
                    and(
                        eq(cs1.session, session),
                        eq(cs1.semester, semester),
                        isNotNull(css1.venueCode),
                        workerNo !== undefined
                            ? eq(cs1.lecturerNo, workerNo)
                            : isNotNull(cs1.lecturerNo),
                        isNotNull(cs2.lecturerNo),
                        ne(cs1.lecturerNo, cs2.lecturerNo)
                    )
                )
                // Order by day and time.
                .orderBy(asc(css1.day), asc(css1.time))
                .execute()
        );
    }

    getAvailableVenues(
        session: TTMSSession,
        semester: TTMSSemester,
        day: CourseSectionScheduleDay,
        times: CourseSectionScheduleTime[]
    ): Promise<IVenue[]> {
        return this.db
            .select()
            .from(venues)
            .where(
                and(
                    // Only include venues from N28/N28A.
                    like(venues.code, "N28%"),
                    gt(venues.capacity, 0),
                    ne(venues.type, VenueType.none),
                    notExists(
                        this.db
                            .select({ exists: sql`1` })
                            .from(courseSectionSchedules)
                            .where(
                                and(
                                    eq(courseSectionSchedules.session, session),
                                    eq(
                                        courseSectionSchedules.semester,
                                        semester
                                    ),
                                    eq(
                                        courseSectionSchedules.venueCode,
                                        venues.code
                                    ),
                                    eq(courseSectionSchedules.day, day),
                                    inArray(courseSectionSchedules.time, times)
                                )
                            )
                    )
                )
            );
    }
}
