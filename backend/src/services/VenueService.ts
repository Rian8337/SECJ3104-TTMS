import { IVenue } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { IVenueRepository } from "@/repositories";
import { inject } from "tsyringe";
import { BaseService } from "./BaseService";
import { IVenueService } from "./IVenueService";

/**
 * A service that is responsible for handling venue-related operations.
 */
@Service(dependencyTokens.venueService)
export class VenueService extends BaseService implements IVenueService {
    constructor(
        @inject(dependencyTokens.venueRepository)
        private readonly venueRepository: IVenueRepository
    ) {
        super();
    }

    getByCode(code: string): Promise<IVenue | null> {
        return this.venueRepository.getByCode(code);
    }
}
