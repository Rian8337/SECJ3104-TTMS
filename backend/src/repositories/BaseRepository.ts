import { DrizzleDb } from "@/database";

/**
 * The base class for all repositories.
 */
export abstract class BaseRepository {
    constructor(
        /**
         * The database instance used by the repository.
         */
        protected readonly db: DrizzleDb
    ) {}
}
