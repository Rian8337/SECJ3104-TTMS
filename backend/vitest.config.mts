import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: { alias: { "@": "/src" } },
    test: {
        include: ["tests/**/*.test.ts"],
        exclude: ["node_modules", "dist"],
        setupFiles: ["tests/setup.ts"],
        passWithNoTests: true,
        coverage: {
            provider: "istanbul",
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
                // Express application setup
                "src/index.ts",
                // Express router setup
                "src/router.ts",
            ],
        },
    },
});
