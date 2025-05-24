import { IVenue } from "@/database/schema";

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
}
