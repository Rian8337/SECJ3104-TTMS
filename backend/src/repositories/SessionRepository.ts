import { ISession, sessions } from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { ISessionRepository } from "./ISessionRepository";
import { BaseRepository } from "./BaseRepository";

/**
 * A repository that is responsible for handling academic session related operations.
 */
@Repository(dependencyTokens.sessionRepository)
export class SessionRepository
    extends BaseRepository
    implements ISessionRepository
{
    getSessions(): Promise<ISession[]> {
        return this.db.select().from(sessions);
    }
}
