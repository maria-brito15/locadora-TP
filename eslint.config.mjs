import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "frontend/dist/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "frontend/src/**/*.{ts,tsx}", "e2e/**/*.ts", "playwright.config.ts"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

      "@stylistic/padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
        {
          blankLine: "always",
          prev: ["const", "let"],
          next: ["if", "for", "while", "switch", "try", "return"],
        },
        {
          blankLine: "always",
          prev: ["if", "for", "while", "switch", "try"],
          next: ["const", "let", "return"],
        },
        {
          blankLine: "always",
          prev: "expression",
          next: ["const", "let"],
        },
        {
          blankLine: "always",
          prev: ["const", "let"],
          next: "expression",
        },
        {
          blankLine: "always",
          prev: "for",
          next: "for",
        },
      ],
    },
  },
);
