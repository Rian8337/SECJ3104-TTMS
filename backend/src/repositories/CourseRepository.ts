import { DrizzleDb } from "@/database";
import { courses, courseSections, ICourse } from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAnalyticsCourse, TTMSSemester, TTMSSession } from "@/types";
import { and, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { ICourseRepository } from "./ICourseRepository";

/**
 * A repository that is responsible for handling course-related operations.
 */
@Repository(dependencyTokens.courseRepository)
export class CourseRepository
    extends BaseRepository
    implements ICourseRepository
{
    constructor(@inject(dependencyTokens.drizzleDb) db: DrizzleDb) {
        super(db);
    }

    getByCode(code: string): Promise<ICourse | null> {
        return this.db
            .select()
            .from(courses)
            .where(eq(courses.code, code))
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    async getSchedulesForAnalytics(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IAnalyticsCourse[]> {
        return this.db.query.courseSections.findMany({
            columns: { section: true },
            with: {
                course: { columns: { code: true, name: true } },
                schedules: {
                    columns: {
                        day: true,
                        time: true,
                    },
                    with: {
                        venue: { columns: { shortName: true } },
                    },
                },
            },
            where: and(
                eq(courseSections.session, session),
                eq(courseSections.semester, semester)
            ),
        });
    }
}
