// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: { project: "./tsconfig.eslint.json" },
        },
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
    {
        files: ["tests/**"],
        plugins: { vitest },
        rules: {
            ...vitest.configs.recommended.rules,
            "@typescript-eslint/unbound-method": "off",
        },
    }
);
