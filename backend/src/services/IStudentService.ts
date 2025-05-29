import { IStudent } from "@/database/schema";
import {
    IStudentAnalytics,
    IStudentSearchEntry,
    ITimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { IService } from "./IService";
import { OperationResult } from "./OperationResult";

/**
 * A service that is responsible for handling student-related operations.
 */
export interface IStudentService extends IService {
    /**
     * Obtains a student by their matric number.
     *
     * @param matricNo The matric number of the student.
     * @returns The student associated with the given matric number, or `null` if not found.
     */
    getByMatricNo(matricNo: string): Promise<IStudent | null>;

    /**
     * Obtains the timetable of a student.
     *
     * @param matricNo The matric number of the student.
     * @param session The academic session to obtain the timetable for.
     * @param semester The academic semester to obtain the timetable for.
     * @returns The timetable of the student.
     */
    getTimetable(
        matricNo: string,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<ITimetable[]>>;

    /**
     * Searches students by their matric number or name.
     *
     * @param session The academic session to search in.
     * @param semester The academic semester to search in.
     * @param query The query to search.
     * @param limit The maximum number of students to return. Defaults to 10.
     * @param offset The number of students to skip before starting to collect the result set. Defaults to 0.
     * @returns The students whose matric numbers or names match the given query.
     */
    search(
        session: TTMSSession,
        semester: TTMSSemester,
        query: string,
        limit?: number,
        offset?: number
    ): Promise<OperationResult<IStudentSearchEntry[]>>;

    /**
     * Generates analytics for students in a given academic session and semester.
     *
     * @param session The academic session to generate analytics for.
     * @param semester The academic semester to generate analytics for.
     * @return The analytics for students in the given session and semester.
     */
    generateAnalytics(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<IStudentAnalytics>>;
}
