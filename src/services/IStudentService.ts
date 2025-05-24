import { IStudent } from "@/database/schema";
import { ITimetable, TTMSSemester, TTMSSession } from "@/types";
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
     * @param query The query to search.
     * @returns The students whose matric numbers or names match the given query.
     */
    search(query: string): Promise<OperationResult<IStudent[]>>;
}
