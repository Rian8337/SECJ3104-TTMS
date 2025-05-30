import { IStudent } from "@/database/schema";
import {
    IRawTimetable,
    IRegisteredStudent,
    IStudentSearchEntry,
    TTMSSemester,
    TTMSSession,
} from "@/types";

/**
 * A repository that is responsible for handling student-related operations.
 */
export interface IStudentRepository {
    /**
     * Obtains a student by their matric number.
     *
     * @param matricNo The matric number of the student.
     * @returns The student with the given matric number, or `null` if not found.
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
    ): Promise<IRawTimetable[]>;

    /**
     * Searches students by their matric number.
     *
     * This uses a full-text search to find students whose matric numbers match the given matric number.
     *
     * @param session The academic session to search in.
     * @param semester The academic semester to search in.
     * @param matricNo The matric number to search.
     * @param limit The maximum number of students to return. Defaults to 10.
     * @param offset The number of students to skip before starting to collect the result set. Defaults to 0.
     * @returns The students whose matric numbers match the given matric number.
     */
    searchByMatricNo(
        session: TTMSSession,
        semester: TTMSSemester,
        matricNo: string,
        limit?: number,
        offset?: number
    ): Promise<IStudentSearchEntry[]>;

    /**
     * Searches students by their name.
     *
     * This uses a full-text search to find students whose names match the given name.
     *
     * @param session The academic session to search in.
     * @param semester The academic semester to search in.
     * @param name The name to search.
     * @param limit The maximum number of students to return. Defaults to 10.
     * @param offset The number of students to skip before starting to collect the result set. Defaults to 0.
     * @returns The students whose names match the given name.
     */
    searchByName(
        session: TTMSSession,
        semester: TTMSSemester,
        name: string,
        limit?: number,
        offset?: number
    ): Promise<IStudentSearchEntry[]>;

    /**
     * Obtains the list of registered students for a given session and semester.
     *
     * @param session The academic session to obtain the registered students for.
     * @param semester The academic semester to obtain the registered students for.
     * @return The list of registered students
     */
    getRegisteredStudents(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IRegisteredStudent[]>;
}
