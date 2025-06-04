import { db } from "@/database";
import { config } from "dotenv";
import {
    cleanupPrimaryTables,
    cleanupSecondaryTables,
    seedPrimaryTables,
} from "./db";

config({ path: ".env.test" });

let setupHappened = false;
let teardownHappened = false;

export async function setup() {
    if (setupHappened) {
        throw new Error("Setup called twice");
    }

    setupHappened = true;

    await wipeTestDb();
    await seedPrimaryTables();
}

export async function teardown() {
    if (teardownHappened) {
        throw new Error("Teardown called twice");
    }

    teardownHappened = true;

    await wipeTestDb();
    db.$client.end();
}

async function wipeTestDb() {
    await cleanupSecondaryTables();
    await cleanupPrimaryTables();
}
