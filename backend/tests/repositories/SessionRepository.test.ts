import { dependencyTokens } from "@/dependencies/tokens";
import { createTestContainer } from "../setup/container";
import { seededPrimaryData } from "../setup/db";

describe("SessionRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.sessionRepository);

    it("[getSessions] Should return all sessions", async () => {
        const sessionsList = await repository.getSessions();

        expect(sessionsList).toHaveLength(seededPrimaryData.sessions.length);
    });
});
