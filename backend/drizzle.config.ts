import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

export default defineConfig({
    dialect: "mysql",
    schema: "./src/database/schema",
    strict: true,
    dbCredentials: {
        host: process.env.DB_HOST!,
        database: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        port: Number(process.env.DB_PORT!) || 3306,
    },
});
