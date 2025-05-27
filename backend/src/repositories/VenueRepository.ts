import { IVenue, venues } from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { eq } from "drizzle-orm";
import { BaseRepository } from "./BaseRepository";
import { IVenueRepository } from "./IVenueRepository";
import { inject } from "tsyringe";
import { DrizzleDb } from "@/database";

/**
 * A repository that is responsible for handling venue-related operations.
 */
@Repository(dependencyTokens.venueRepository)
export class VenueRepository
    extends BaseRepository
    implements IVenueRepository
{
    constructor(@inject(dependencyTokens.drizzleDb) db: DrizzleDb) {
        super(db);
    }

    async getByCode(code: string): Promise<IVenue | null> {
        const res = await this.db
            .select()
            .from(venues)
            .where(eq(venues.code, code))
            .limit(1);

        return res.at(0) ?? null;
    }
}
