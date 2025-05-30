import { IVenue } from "@/database/schema";
import { IRawVenueClashTimetable } from "@/types";
import { TTMSSemester, TTMSSession } from "@/types/ttms";

/**
 * A repository that is responsible for handling venue-related operations.
 */
export interface IVenueRepository {
    /**
     * Obtains a venue by its code.
     *
     * @param code The code of the venue.
     * @returns The venue with the given code, or `null` if not found.
     */
    getByCode(code: string): Promise<IVenue | null>;

    /**
     * Obtains the timetables that clash with venues in a lecturer's timetable.
     *
     * @param session The academic session to obtain the timetable for.
     * @param semester The academic semester to obtain the timetable for.
     * @param workerNo The worker number of the lecturer. If omitted, timetables from *all* lecturers
     * will be returned.
     * @returns The list of clashing timetables.
     */
    getVenueClashes(
        session: TTMSSession,
        semester: TTMSSemester,
        workerNo?: number
    ): Promise<IRawVenueClashTimetable[]>;
}
