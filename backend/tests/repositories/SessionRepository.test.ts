import { beforeEach, describe, expect, it } from "vitest";
import { sessions } from "../../src/database/schema";
import { dependencyTokens } from "../../src/dependencies/tokens";
import { SessionRepository } from "../../src/repositories";
import { createMockDb } from "../mocks";
import { setupTestContainer } from "../setup/container";
import { seeders } from "../setup/db";

describe("SessionRepository (unit)", () => {
    let repository: SessionRepository;
    let mockDb: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        mockDb = createMockDb();
        repository = new SessionRepository(mockDb);
    });

    it("[getSessions] Should call database", async () => {
        await repository.getSessions();

        expect(mockDb.select).toHaveBeenCalled();
        expect(mockDb.from).toHaveBeenCalledExactlyOnceWith(sessions);
        expect(mockDb.from).toHaveBeenCalledAfter(mockDb.select);
    });
});

describe("SessionRepository (integration)", () => {
    const container = setupTestContainer();
    const repository = container.resolve(dependencyTokens.sessionRepository);

    it("[getSessions] Should return all sessions", async () => {
        const session = await seeders.session.seedOne({
            session: "2023/2024",
            semester: 1,
            startDate: new Date("2023-09-01"),
            endDate: new Date("2024-06-30"),
        });

        const sessionsList = await repository.getSessions();

        expect(sessionsList).toBeDefined();
        expect(sessionsList.length).toBeGreaterThan(0);

        const firstSession = sessionsList[0];

        expect(firstSession).toEqual(session);
    });
});
