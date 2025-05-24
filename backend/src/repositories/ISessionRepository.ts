import { ISession } from "@/database/schema";

/**
 * A repository that is responsible for handling academic session related operations.
 */
export interface ISessionRepository {
    /**
     * Obtains all academic sessions.
     *
     * @returns A list of all academic sessions.
     */
    getSessions(): Promise<ISession[]>;
}
