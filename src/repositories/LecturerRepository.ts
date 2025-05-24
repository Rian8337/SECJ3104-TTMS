import { db } from "@/database";
import {
    courseSections,
    courseSectionSchedules,
    ILecturer,
    lecturers,
} from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { ITimetable, TTMSSemester, TTMSSession } from "@/types";
import { and, eq, or, sql } from "drizzle-orm";
import { ILecturerRepository } from "./ILecturerRepository";

/**
 * A repository that is responsible for handling lecturer-related operations.
 */
@Repository(dependencyTokens.lecturerRepository)
export class LecturerRepository implements ILecturerRepository {
    async getByWorkerNo(workerNo: number): Promise<ILecturer | null> {
        const res = await db
            .select()
            .from(lecturers)
            .where(eq(lecturers.workerNo, workerNo));

        return res.at(0) ?? null;
    }

    async getTimetable(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<ITimetable[]> {
        const registeredCourses = await db
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

        return db.query.courseSectionSchedules.findMany({
            columns: {
                day: true,
                time: true,
            },
            with: {
                courseSection: {
                    columns: { section: true },
                    with: {
                        course: { columns: { code: true, name: true } },
                        lecturer: { columns: { name: true } },
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

    searchByName(name: string, limit = 10, offset = 0): Promise<ILecturer[]> {
        return db
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
