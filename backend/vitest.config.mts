import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: { alias: { "@": "/src" } },
    test: {
        include: ["tests/**/*.test.ts"],
        exclude: ["node_modules", "dist"],
        setupFiles: ["tests/setup.ts"],
    },
});
