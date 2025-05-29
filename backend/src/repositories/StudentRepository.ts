import { DrizzleDb } from "@/database";
import {
    courseSectionSchedules,
    IStudent,
    studentRegisteredCourses,
    students,
} from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    IRegisteredStudent,
    IStudentSearchEntry,
    ITimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { and, eq, or, SQL, sql } from "drizzle-orm";
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

    async getByMatricNo(matricNo: string): Promise<IStudent | null> {
        const res = await this.db
            .select()
            .from(students)
            .where(eq(students.matricNo, matricNo.toUpperCase()))
            .limit(1);

        return res.at(0) ?? null;
    }

    async getTimetable(
        matricNo: string,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<ITimetable[]> {
        const registeredCourses = await this.db
            .select({
                courseCode: studentRegisteredCourses.courseCode,
                section: studentRegisteredCourses.section,
            })
            .from(studentRegisteredCourses)
            .where(
                and(
                    eq(
                        studentRegisteredCourses.matricNo,
                        matricNo.toUpperCase()
                    ),
                    eq(studentRegisteredCourses.session, session),
                    eq(studentRegisteredCourses.semester, semester)
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

    private async getSearchResult(
        session: TTMSSession,
        semester: TTMSSemester,
        matchExpr: SQL<number>,
        placeholders: Record<string, unknown>,
        limit: number,
        offset: number
    ): Promise<IStudentSearchEntry[]> {
        const registeredStudents = await this.db
            .selectDistinct({ matricNo: studentRegisteredCourses.matricNo })
            .from(studentRegisteredCourses)
            .where(
                and(
                    eq(studentRegisteredCourses.session, session),
                    eq(studentRegisteredCourses.semester, semester)
                )
            );

        if (registeredStudents.length === 0) {
            return [];
        }

        const studentsMatch = await this.db
            .select()
            .from(
                this.db
                    .select({
                        matricNo: students.matricNo,
                        name: students.name,
                        courseCode: students.courseCode,
                        relevance: matchExpr.as("relevance"),
                    })
                    .from(students)
                    .as("sub")
            )
            .where(sql`sub.relevance > 0`)
            .orderBy(sql`sub.relevance DESC`)
            .execute(placeholders);

        if (studentsMatch.length === 0) {
            return [];
        }

        const registeredMatricNos = new Set(
            registeredStudents.map((s) => s.matricNo)
        );

        return studentsMatch
            .filter((s) => registeredMatricNos.has(s.matricNo))
            .slice(offset, offset + limit)
            .map((s) => ({
                matricNo: s.matricNo,
                name: s.name,
                courseCode: s.courseCode,
            }));
    }
}
