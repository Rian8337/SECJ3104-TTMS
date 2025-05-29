import { DrizzleDb } from "@/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
    ILecturer,
    lecturers,
} from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    IRawTimetable,
    IRawVenueClashTimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { and, asc, eq, isNotNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { inject } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { ILecturerRepository } from "./ILecturerRepository";

/**
 * A repository that is responsible for handling lecturer-related operations.
 */
@Repository(dependencyTokens.lecturerRepository)
export class LecturerRepository
    extends BaseRepository
    implements ILecturerRepository
{
    constructor(@inject(dependencyTokens.drizzleDb) db: DrizzleDb) {
        super(db);
    }

    async getByWorkerNo(workerNo: number): Promise<ILecturer | null> {
        const res = await this.db
            .select()
            .from(lecturers)
            .where(eq(lecturers.workerNo, workerNo))
            .limit(1);

        return res.at(0) ?? null;
    }

    async getTimetable(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IRawTimetable[]> {
        const css = alias(courseSectionSchedules, "css");
        const c = alias(courses, "c");
        const cs = alias(courseSections, "cs");
        const l = alias(lecturers, "l");

        return (
            this.db
                .select({
                    scheduleDay: css.day,
                    scheduleTime: css.time,
                    venueShortName: css.venueCode,
                    courseCode: css.courseCode,
                    section: css.section,
                    courseName: c.name,
                    lecturerNo: cs.lecturerNo,
                    lecturerName: l.name,
                })
                .from(css)
                // Join to obtain the lecturer number of the course section.
                .innerJoin(
                    cs,
                    and(
                        eq(css.session, cs.session),
                        eq(css.semester, cs.semester),
                        eq(css.courseCode, cs.courseCode),
                        eq(css.section, cs.section)
                    )
                )
                // Join to obtain the name of the course.
                .innerJoin(c, eq(cs.courseCode, c.code))
                // Join to obtain the name of the lecturer.
                .innerJoin(l, eq(cs.lecturerNo, l.workerNo))
                // Filter by the lecturer's worker number, session, and semester.
                .where(
                    and(
                        eq(css.session, session),
                        eq(css.semester, semester),
                        eq(cs.lecturerNo, workerNo)
                    )
                )
                // Order by day and time.
                .orderBy(asc(css.day), asc(css.time))
                .execute()
        );
    }

    getVenueClashes(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
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

        return (
            this.db
                .selectDistinct({
                    section: cs1.section,
                    courseCode: cs1.courseCode,
                    session: cs1.session,
                    semester: cs1.semester,
                    lecturerNo: cs1.lecturerNo,
                    lecturerName: l.name,
                    courseName: c.name,
                    scheduleDay: css1.day,
                    scheduleTime: css1.time,
                    scheduleVenue: css1.venueCode,
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
                // Filter the results to the current academic session and semester, and exclude
                // the lecturer's own course sections.
                .where(
                    and(
                        eq(cs1.session, session),
                        eq(cs1.semester, semester),
                        eq(cs1.lecturerNo, workerNo),
                        isNotNull(css1.venueCode),
                        isNotNull(cs2.lecturerNo),
                        ne(cs1.lecturerNo, cs2.lecturerNo)
                    )
                )
                // Order by day and time.
                .orderBy(asc(css1.day), asc(css1.time))
                .execute()
        );
    }

    searchByName(name: string, limit = 10, offset = 0): Promise<ILecturer[]> {
        if (limit < 1) {
            throw new Error("Limit must be at least 1");
        }

        if (offset < 0) {
            throw new Error("Offset must be at least 0");
        }

        return this.db
            .select()
            .from(lecturers)
            .where(
                sql`MATCH(${lecturers.name}) AGAINST(${sql.placeholder("name")} IN BOOLEAN MODE)`
            )
            .limit(limit)
            .offset(offset)
            .execute({ name: name.split(" ").join("+ ").trim() });
    }
}
