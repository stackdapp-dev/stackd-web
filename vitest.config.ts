import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dotenv from "dotenv";

// Load .env file for tests
dotenv.config();

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./test/setup.ts"],
        include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
        environmentMatchGlobs: [
            ["test/**/*.tsx", "jsdom"],
        ],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: [
                "src/lib/**/*.ts",
                "src/hooks/**/*.ts",
                "src/hooks/**/*.tsx",
            ],
            exclude: ["**/*.test.ts", "**/*.d.ts", "src/lib/api/**"],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});
