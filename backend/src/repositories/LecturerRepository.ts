import {
    courseSections,
    courseSectionSchedules,
    ILecturer,
    lecturers,
} from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { ITimetable, TTMSSemester, TTMSSession } from "@/types";
import { and, eq, isNotNull, ne, or, sql } from "drizzle-orm";
import { BaseRepository } from "./BaseRepository";
import { ILecturerRepository } from "./ILecturerRepository";
import { inject } from "tsyringe";
import { DrizzleDb } from "@/database";

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
    ): Promise<ITimetable[]> {
        const registeredCourses = await this.db
            .select({
                courseCode: courseSections.courseCode,
                section: courseSections.section,
            })
            .from(courseSections)
            .where(
                and(
                    eq(courseSections.session, session),
                    eq(courseSections.semester, semester),
                    eq(courseSections.lecturerNo, workerNo)
                )
            );

        if (registeredCourses.length === 0) {
            return [];
        }

        return this.db.query.courseSectionSchedules.findMany({
            columns: {
                day: true,
                time: true,
            },
            with: {
                courseSection: {
                    columns: { section: true },
                    with: {
                        course: { columns: { code: true, name: true } },
                        lecturer: true,
                    },
                },
                venue: { columns: { shortName: true } },
            },
            where: or(
                ...registeredCourses.map((c) =>
                    and(
                        eq(courseSectionSchedules.session, session),
                        eq(courseSectionSchedules.semester, semester),
                        eq(courseSectionSchedules.courseCode, c.courseCode),
                        eq(courseSectionSchedules.section, c.section)
                    )
                )
            ),
        });
    }

    async getClashingTimetable(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<ITimetable[]> {
        const registeredCourses = await this.db
            .select({
                courseCode: courseSections.courseCode,
                section: courseSections.section,
            })
            .from(courseSections)
            .where(
                and(
                    eq(courseSections.session, session),
                    eq(courseSections.semester, semester),
                    eq(courseSections.lecturerNo, workerNo)
                )
            );

        if (registeredCourses.length === 0) {
            return [];
        }

        const lecturerTimetable = await this.db
            .select({
                day: courseSectionSchedules.day,
                time: courseSectionSchedules.time,
                courseCode: courseSectionSchedules.courseCode,
                section: courseSectionSchedules.section,
                venueCode: courseSectionSchedules.venueCode,
            })
            .from(courseSectionSchedules)
            .where(
                and(
                    eq(courseSectionSchedules.session, session),
                    eq(courseSectionSchedules.semester, semester),
                    isNotNull(courseSectionSchedules.venueCode),
                    or(
                        ...registeredCourses.map((c) =>
                            and(
                                eq(
                                    courseSectionSchedules.courseCode,
                                    c.courseCode
                                ),
                                eq(courseSectionSchedules.section, c.section)
                            )
                        )
                    )
                )
            );

        if (lecturerTimetable.length === 0) {
            return [];
        }

        return this.db.query.courseSectionSchedules.findMany({
            columns: {
                day: true,
                time: true,
            },
            with: {
                courseSection: {
                    columns: { section: true },
                    with: {
                        course: { columns: { code: true, name: true } },
                        lecturer: true,
                    },
                },
                venue: { columns: { shortName: true } },
            },
            where: and(
                eq(courseSectionSchedules.session, session),
                eq(courseSectionSchedules.semester, semester),
                isNotNull(courseSectionSchedules.venueCode),
                or(
                    ...lecturerTimetable.map((t) =>
                        and(
                            eq(courseSectionSchedules.day, t.day),
                            eq(courseSectionSchedules.time, t.time),
                            // Don't include the lecturer's course sections
                            ne(courseSectionSchedules.courseCode, t.courseCode),
                            ne(courseSectionSchedules.section, t.section),
                            eq(courseSectionSchedules.venueCode, t.venueCode!)
                        )
                    )
                )
            ),
        });
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
