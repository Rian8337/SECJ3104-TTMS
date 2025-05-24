import { ICourse } from "@/database/schema";

/**
 * A repository that is responsible for handling course-related operations.
 */
export interface ICourseRepository {
    /**
     * Obtains a course by its code.
     *
     * @param code The code of the course.
     * @returns The course with the given code, or `null` if not found.
     */
    getCourseByCode(code: string): Promise<ICourse | null>;
}
