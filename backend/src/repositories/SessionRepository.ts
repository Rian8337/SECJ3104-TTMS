import { db } from "@/database";
import { ISession, sessions } from "@/database/schema";
import { Repository } from "@/decorators/repository";
import { dependencyTokens } from "@/dependencies/tokens";
import { ISessionRepository } from "./ISessionRepository";

/**
 * A repository that is responsible for handling academic session related operations.
 */
@Repository(dependencyTokens.sessionRepository)
export class SessionRepository implements ISessionRepository {
    getSessions(): Promise<ISession[]> {
        return db.select().from(sessions);
    }
}
