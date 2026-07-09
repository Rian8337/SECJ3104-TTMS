import { DrizzleDb } from "@/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
    ICourse,
    venues,
} from "@/database/schema";
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
        // Uses explicit joins rather than the relational query API, as the latter
        // compiles `with` clauses for one-to-many relations (`schedules`) into
        // `LEFT JOIN LATERAL` subqueries, which MariaDB does not support.
        const rows = await this.db
            .select({
                section: courseSections.section,
                courseCode: courses.code,
                courseName: courses.name,
                day: courseSectionSchedules.day,
                time: courseSectionSchedules.time,
                venueShortName: venues.shortName,
            })
            .from(courseSections)
            .innerJoin(courses, eq(courseSections.courseCode, courses.code))
            .leftJoin(
                courseSectionSchedules,
                and(
                    eq(courseSectionSchedules.session, courseSections.session),
                    eq(
                        courseSectionSchedules.semester,
                        courseSections.semester
                    ),
                    eq(
                        courseSectionSchedules.courseCode,
                        courseSections.courseCode
                    ),
                    eq(courseSectionSchedules.section, courseSections.section)
                )
            )
            .leftJoin(venues, eq(courseSectionSchedules.venueCode, venues.code))
            .where(
                and(
                    eq(courseSections.session, session),
                    eq(courseSections.semester, semester)
                )
            );

        const courseSectionsMap = new Map<string, IAnalyticsCourse>();

        for (const row of rows) {
            const key = `${row.courseCode}-${row.section}`;
            let courseSection = courseSectionsMap.get(key);

            if (!courseSection) {
                courseSection = {
                    section: row.section,
                    course: { code: row.courseCode, name: row.courseName },
                    schedules: [],
                };

                courseSectionsMap.set(key, courseSection);
            }

            if (row.day !== null && row.time !== null) {
                courseSection.schedules.push({
                    day: row.day,
                    time: row.time,
                    venue: row.venueShortName
                        ? { shortName: row.venueShortName }
                        : null,
                });
            }
        }

        return [...courseSectionsMap.values()];
    }
}
