import { ILecturer } from "@/database/schema";
import {
    ITimetable,
    IVenueClashTimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { IService } from "./IService";
import { OperationResult } from "./OperationResult";

/**
 * A service that is responsible for handling lecturer-related operations.
 */
export interface ILecturerService extends IService {
    /**
     * Obtains a lecturer by their worker number.
     *
     * @param workerNo The worker number of the lecturer.
     * @returns The lecturer associated with the given worker number, or `null` if not found.
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
    ): Promise<OperationResult<ITimetable[]>>;

    /**
     * Obtains the timetables that clash with venues in a lecturer's timetable.
     *
     * @param session The academic session to obtain the timetable for.
     * @param semester The academic semester to obtain the timetable for.
     * @param workerNo The worker number of the lecturer.
     * @returns The list of clashing timetables.
     */
    getVenueClashes(
        session: TTMSSession,
        semester: TTMSSemester,
        workerNo: number
    ): Promise<OperationResult<IVenueClashTimetable[]>>;

    /**
     * Searches lecturers by their name.
     *
     * @param session The academic session to search in.
     * @param semester The academic semester to search in.
     * @param query The query to search.
     * @param limit The maximum number of lecturers to return. Defaults to 10.
     * @param offset The number of lecturers to skip before starting to collect the result set. Defaults to 0.
     * @returns The lecturers whose names match the given query.
     */
    search(
        session: TTMSSession,
        semester: TTMSSemester,
        query: string,
        limit?: number,
        offset?: number
    ): Promise<OperationResult<ILecturer[]>>;
}
