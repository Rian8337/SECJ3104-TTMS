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
import { IRawTimetable, TTMSSemester, TTMSSession } from "@/types";
import { and, asc, desc, eq, exists, gt, sql } from "drizzle-orm";
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

    searchByName(
        session: TTMSSession,
        semester: TTMSSemester,
        name: string,
        limit = 10,
        offset = 0
    ): Promise<ILecturer[]> {
        if (limit < 1) {
            throw new Error("Limit must be at least 1");
        }

        if (offset < 0) {
            throw new Error("Offset must be at least 0");
        }

        const sub = this.db
            .select({
                workerNo: lecturers.workerNo,
                name: lecturers.name,
                relevance:
                    sql<number>`MATCH(${lecturers.name}) AGAINST(${sql.placeholder("name")} IN BOOLEAN MODE)`.as(
                        "relevance"
                    ),
            })
            .from(lecturers)
            .as("sub");

        return this.db
            .select({
                workerNo: sub.workerNo,
                name: sub.name,
            })
            .from(sub)
            .where(
                and(
                    gt(sub.relevance, 0),
                    exists(
                        this.db
                            .select({ exists: sql`1` })
                            .from(courseSections)
                            .where(
                                and(
                                    eq(courseSections.session, session),
                                    eq(courseSections.semester, semester),
                                    eq(courseSections.lecturerNo, sub.workerNo)
                                )
                            )
                    )
                )
            )
            .orderBy(desc(sub.relevance))
            .limit(limit)
            .offset(offset)
            .execute({
                name: name
                    .trim()
                    .split(/\s+/g)
                    .map((s) => `+${s}*`)
                    .join(" ")
                    .toUpperCase(),
            });
    }
}
