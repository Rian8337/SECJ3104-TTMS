import { ILecturer } from "@/database/schema";
import {
    IRawTimetable,
    IRawVenueClashTimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";

/**
 * A repository that is responsible for handling lecturer-related operations.
 */
export interface ILecturerRepository {
    /**
     * Obtains a lecturer by their worker number.
     *
     * @param workerNo The worker number of the lecturer.
     * @returns The lecturer with the given worker number, or `null` if not found.
     */
    getByWorkerNo(workerNo: number): Promise<ILecturer | null>;

    /**
     * Obtains the timetable of a lecturer.
     *
     * @param workerNo The worker number of the lecturer.
     * @param session The academic session to obtain the timetable for.
     * @param semester The academic semester to obtain the timetable for.
     * @returns The timetable of the lecturer.
     */
    getTimetable(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IRawTimetable[]>;

    /**
     * Obtains the timetables that clash with venues in a lecturer's timetable.
     *
     * @param workerNo The worker number of the lecturer.
     * @param session The academic session to obtain the timetable for.
     * @param semester The academic semester to obtain the timetable for.
     * @returns The list of clashing timetables.
     */
    getVenueClashes(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IRawVenueClashTimetable[]>;

    /**
     * Searches lecturers by their name.
     *
     * This uses a full-text search to find lecturers whose names match the given name.
     *
     * @param name The name to search.
     * @param limit The maximum number of lecturers to return. Defaults to 10.
     * @param offset The number of lecturers to skip before starting to collect the result set. Defaults to 0.
     * @returns The lecturers whose names match the given name.
     */
    searchByName(
        name: string,
        limit?: number,
        offset?: number
    ): Promise<ILecturer[]>;
}
