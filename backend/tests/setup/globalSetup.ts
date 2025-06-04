import { config } from "dotenv";
import { cleanupPrimaryTables, seedPrimaryTables } from "./db";
import { db } from "@/database";

config({ path: ".env.test" });

let setupHappened = false;
let teardownHappened = false;

export async function setup() {
    if (setupHappened) {
        throw new Error("Setup called twice");
    }

    setupHappened = true;

    await cleanupPrimaryTables();
    await seedPrimaryTables();
}

export async function teardown() {
    if (teardownHappened) {
        throw new Error("Teardown called twice");
    }

    teardownHappened = true;
    await cleanupPrimaryTables();

    db.$client.end();
}
