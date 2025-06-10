import { IVenue } from "@/database/schema";
import { IService } from "./IService";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    TTMSSemester,
    TTMSSession,
} from "@/types";

/**
 * A service that is responsible for handling venue-related operations.
 */
export interface IVenueService extends IService {
    /**
     * Obtains a venue by its code.
     *
     * @param code The code of the venue.
     * @returns The venue with the given code, or `null` if not found.
     */
    getByCode(code: string): Promise<IVenue | null>;

    /**
     * Obtains the venues that are available in a given academic session and semester
     * for a specific day and time range.
     *
     * @param session The academic session to check availability in.
     * @param semester The academic semester to check availability in.
     * @param day The day of the week to check availability for.
     * @param times The time range to check availability for.
     * @returns The available venues.
     */
    getAvailableVenues(
        session: TTMSSession,
        semester: TTMSSemester,
        day: CourseSectionScheduleDay,
        times: CourseSectionScheduleTime[]
    ): Promise<IVenue[]>;
}
