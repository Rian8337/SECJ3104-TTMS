import { DrizzleDb } from "@/database";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";

/**
 * The base class for all repositories.
 */
export abstract class BaseRepository {
    constructor(
        /**
         * The database instance used by the repository.
         */
        @inject(dependencyTokens.drizzleDb)
        protected readonly db: DrizzleDb
    ) {}
}
