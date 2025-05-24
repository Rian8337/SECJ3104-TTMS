import { db } from "@/database";
import { courses, ICourse } from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { eq } from "drizzle-orm";
import { ICourseRepository } from "./ICourseRepository";

/**
 * A repository that is responsible for handling course-related operations.
 */
@Repository(dependencyTokens.courseRepository)
export class CourseRepository implements ICourseRepository {
    async getCourseByCode(code: string): Promise<ICourse | null> {
        const res = await db
            .select()
            .from(courses)
            .where(eq(courses.code, code))
            .limit(1);

        return res.at(0) ?? null;
    }
}
