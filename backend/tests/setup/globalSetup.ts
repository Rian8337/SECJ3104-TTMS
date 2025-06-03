import { config } from "dotenv";
import { cleanupPrimaryTables, seedPrimaryTables } from "./db";

config({ path: ".env.test" });

let teardownHappened = false;

export async function setup() {
    await seedPrimaryTables();
}

export async function teardown() {
    if (teardownHappened) {
        throw new Error("Teardown called twice");
    }

    teardownHappened = true;
    await cleanupPrimaryTables();
}
