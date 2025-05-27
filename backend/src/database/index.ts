import "dotenv/config";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import * as schema from "./schema";

/**
 * The database connection.
 */
export const db = drizzle<typeof schema>(
    createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT ?? "3306"),
    }).pool,
    { casing: "snake_case", schema: schema, mode: "default" }
);

/**
 * The type of the Drizzle database.
 */
export type DrizzleDb = MySql2Database<typeof schema>;

// Since Drizzle does not support FULLTEXT indexes yet, we need to create them manually.
// See: https://github.com/drizzle-team/drizzle-orm/pull/1030
db.execute(
    `ALTER TABLE student ADD FULLTEXT INDEX idx_student_name_fulltext (name)`
).catch(() => null);

db.execute(
    `ALTER TABLE lecturer ADD FULLTEXT INDEX idx_lecturer_name_fulltext (name)`
).catch(() => null);
