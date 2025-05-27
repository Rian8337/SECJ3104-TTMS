import {
    courseSectionSchedules,
    IStudent,
    studentRegisteredCourses,
    students,
} from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { ITimetable, TTMSSemester, TTMSSession } from "@/types";
import { and, eq, or, sql } from "drizzle-orm";
import { IStudentRepository } from "./IStudentRepository";
import { BaseRepository } from "./BaseRepository";
import { inject } from "tsyringe";
import { DrizzleDb } from "@/database";

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
            .where(eq(students.matricNo, matricNo))
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
                    eq(studentRegisteredCourses.matricNo, matricNo),
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
        matricNo: string,
        limit = 10,
        offset = 0
    ): Promise<IStudent[]> {
        if (limit < 1) {
            throw new RangeError("Limit must be greater than 0");
        }

        if (offset < 0) {
            throw new RangeError("Offset must be greater than or equal to 0");
        }

        return this.db
            .select()
            .from(students)
            .where(
                sql`MATCH(${students.matricNo}) AGAINST(${"+" + matricNo} IN BOOLEAN MODE)`
            )
            .limit(limit)
            .offset(offset);
    }

    searchByName(name: string, limit = 10, offset = 0): Promise<IStudent[]> {
        return this.db
            .select()
            .from(students)
            .where(
                sql`MATCH(${students.name}) AGAINST(${sql.placeholder("name")} IN BOOLEAN MODE)`
            )
            .limit(limit)
            .offset(offset)
            .execute({ name: name.split(" ").join("+ ").trim() });
    }
}
