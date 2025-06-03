import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: { alias: { "@": "/src" } },
    test: {
        include: ["tests/**/*.test.ts"],
        exclude: ["node_modules", "dist"],
        setupFiles: ["tests/setup/setup.ts"],
        globalSetup: ["tests/setup/globalSetup.ts"],
        globals: true,
        passWithNoTests: true,
        coverage: {
            provider: "istanbul",
            include: ["src/**/*.ts"],
            exclude: [
                // Test files
                "tests/**",
                // Upstream API services
                "src/api/**",
                // Drizzle ORM setup
                "src/database/**",
                // Dependency registrations
                "src/dependencies/**",
                // Upstream API data scrapers
                "src/scrapers/**",
                // Well-known encryption utility functions
                "src/utils/crypto.ts",
                // Express application setup
                "src/index.ts",
                // Express router setup
                "src/router.ts",
            ],
        },
    },
});
