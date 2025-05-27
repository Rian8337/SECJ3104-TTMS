import { courses, ICourse } from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { eq } from "drizzle-orm";
import { BaseRepository } from "./BaseRepository";
import { ICourseRepository } from "./ICourseRepository";
import { inject } from "tsyringe";
import { DrizzleDb } from "@/database";

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

    async getCourseByCode(code: string): Promise<ICourse | null> {
        const res = await this.db
            .select()
            .from(courses)
            .where(eq(courses.code, code))
            .limit(1);

        return res.at(0) ?? null;
    }
}
