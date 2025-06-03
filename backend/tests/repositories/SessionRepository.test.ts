import { DrizzleDb } from "@/database";
import { sessions } from "@/database/schema";
import { dependencyTokens } from "@/dependencies/tokens";
import { SessionRepository } from "@/repositories";
import { createMockDb } from "../mocks";
import { createTestContainer } from "../setup/container";
import { seededPrimaryData } from "../setup/db";

describe("SessionRepository (unit)", () => {
    let repository: SessionRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new SessionRepository(mockDb as unknown as DrizzleDb);
    });

    it("[getSessions] Should call database", async () => {
        await repository.getSessions();

        expect(mockDb.select).toHaveBeenCalled();
        expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(sessions);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
    });
});

describe("SessionRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.sessionRepository);

    it("[getSessions] Should return all sessions", async () => {
        const sessionsList = await repository.getSessions();

        expect(sessionsList).toHaveLength(seededPrimaryData.sessions.length);
    });
});
