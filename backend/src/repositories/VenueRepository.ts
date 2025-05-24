import { db } from "@/database";
import { IVenue, venues } from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { eq } from "drizzle-orm";
import { IVenueRepository } from "./IVenueRepository";

/**
 * A repository that is responsible for handling venue-related operations.
 */
@Repository(dependencyTokens.venueRepository)
export class VenueRepository implements IVenueRepository {
    async getByCode(code: string): Promise<IVenue | null> {
        const res = await db
            .select()
            .from(venues)
            .where(eq(venues.code, code))
            .limit(1);

        return res.at(0) ?? null;
    }
}
