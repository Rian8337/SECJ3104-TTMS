import { ICourse } from "@/database/schema";
import { IAnalyticsCourse, TTMSSemester, TTMSSession } from "@/types";

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
    getByCode(code: string): Promise<ICourse | null>;

    /**
     * Obtains all schedules for a given session and semester.
     *
     * @param session The academic session to obtain the schedules for.
     * @param semester The academic semester to obtain the schedules for.
     * @returns An array of course section schedules for the given session and semester.
     */
    getSchedulesForAnalytics(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IAnalyticsCourse[]>;
}
