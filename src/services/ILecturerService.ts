import { ILecturer } from "@/database/schema";
import { ITimetable, TTMSSemester, TTMSSession } from "@/types";
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
}
