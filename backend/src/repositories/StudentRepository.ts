import { DrizzleDb } from "@/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
    IStudent,
    lecturers,
    studentRegisteredCourses,
    students,
    venues,
} from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    IRawTimetable,
    IRegisteredStudent,
    IStudentSearchEntry,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { and, asc, desc, eq, exists, gt, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { inject } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IStudentRepository } from "./IStudentRepository";

/**
 * A repository that is responsible for handling student-related operations.
 */
@Repository(dependencyTokens.studentRepository)
export class StudentRepository
    extends BaseRepository
    implements IStudentRepository
{
    constructor(@inject(dependencyTokens.drizzleDb) db: DrizzleDb) {
        super(db);
    }

    getByMatricNo(matricNo: string): Promise<IStudent | null> {
        return this.db
            .select()
            .from(students)
            .where(eq(students.matricNo, matricNo.toUpperCase()))
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    getTimetable(
        matricNo: string,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IRawTimetable[]> {
        const css = alias(courseSectionSchedules, "css");
        const src = alias(studentRegisteredCourses, "src");
        const c = alias(courses, "c");
        const cs = alias(courseSections, "cs");
        const l = alias(lecturers, "l");
        const v = alias(venues, "v");

        return (
            this.db
                .select({
                    scheduleDay: css.day,
                    scheduleTime: css.time,
                    venueShortName: v.shortName,
                    courseCode: src.courseCode,
                    section: src.section,
                    courseName: c.name,
                    lecturerNo: cs.lecturerNo,
                    lecturerName: l.name,
                })
                .from(css)
                // Join to obtain the section of the course section.
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
                // Join to obtain the courses registered by the student.
                .innerJoin(
                    src,
                    and(
                        eq(src.session, css.session),
                        eq(src.semester, css.semester),
                        eq(src.courseCode, css.courseCode),
                        eq(src.section, css.section)
                    )
                )
                // Left join to obtain the lecturer details, if any.
                .leftJoin(l, eq(cs.lecturerNo, l.workerNo))
                // Left join to obtain the venue details, if any.
                .leftJoin(v, eq(css.venueCode, v.code))
                // Filter by the student's matric number, session, and semester.
                .where(
                    and(
                        eq(src.matricNo, matricNo.toUpperCase()),
                        eq(css.session, session),
                        eq(css.semester, semester)
                    )
                )
                // Order by day and time.
                .orderBy(asc(css.day), asc(css.time))
                .execute()
        );
    }

    searchByMatricNo(
        session: TTMSSession,
        semester: TTMSSemester,
        matricNo: string,
        limit = 10,
        offset = 0
    ): Promise<IStudentSearchEntry[]> {
        if (limit < 1) {
            throw new RangeError("Limit must be greater than 0");
        }

        if (offset < 0) {
            throw new RangeError("Offset must be greater than or equal to 0");
        }

        const matchExpr = sql<number>`MATCH(${students.matricNo}) AGAINST(${sql.placeholder("matricNo")} IN BOOLEAN MODE)`;

        return this.getSearchResult(
            session,
            semester,
            matchExpr,
            { matricNo: `+${matricNo.trim().toUpperCase()}*` },
            limit,
            offset
        );
    }

    searchByName(
        session: TTMSSession,
        semester: TTMSSemester,
        name: string,
        limit = 10,
        offset = 0
    ): Promise<IStudentSearchEntry[]> {
        if (limit < 1) {
            throw new RangeError("Limit must be greater than 0");
        }

        if (offset < 0) {
            throw new RangeError("Offset must be greater than or equal to 0");
        }

        const matchExpr = sql<number>`MATCH(${students.name}) AGAINST(${sql.placeholder("name")} IN BOOLEAN MODE)`;

        return this.getSearchResult(
            session,
            semester,
            matchExpr,
            {
                name: name
                    .trim()
                    .split(/\s+/g)
                    .map((s) => `+${s}*`)
                    .join(" ")
                    .toUpperCase(),
            },
            limit,
            offset
        );
    }

    getRegisteredStudents(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IRegisteredStudent[]> {
        return this.db.query.studentRegisteredCourses.findMany({
            columns: {
                courseCode: true,
                section: true,
            },
            with: {
                student: {
                    columns: { matricNo: true, name: true, courseCode: true },
                },
            },
            where: and(
                eq(studentRegisteredCourses.session, session),
                eq(studentRegisteredCourses.semester, semester)
            ),
        });
    }

    private getSearchResult(
        session: TTMSSession,
        semester: TTMSSemester,
        matchExpr: SQL<number>,
        placeholders: Record<string, unknown>,
        limit: number,
        offset: number
    ): Promise<IStudentSearchEntry[]> {
        const sub = this.db
            .select({
                matricNo: students.matricNo,
                name: students.name,
                courseCode: students.courseCode,
                relevance: matchExpr.as("relevance"),
            })
            .from(students)
            .as("sub");

        return this.db
            .select({
                matricNo: sub.matricNo,
                name: sub.name,
                courseCode: sub.courseCode,
            })
            .from(sub)
            .where(
                and(
                    gt(sub.relevance, 0),
                    exists(
                        this.db
                            .select({ exists: sql`1` })
                            .from(studentRegisteredCourses)
                            .where(
                                and(
                                    eq(
                                        studentRegisteredCourses.matricNo,
                                        sub.matricNo
                                    ),
                                    eq(
                                        studentRegisteredCourses.session,
                                        session
                                    ),
                                    eq(
                                        studentRegisteredCourses.semester,
                                        semester
                                    )
                                )
                            )
                    )
                )
            )
            .orderBy(desc(sub.relevance))
            .limit(limit)
            .offset(offset)
            .execute(placeholders);
    }
}
