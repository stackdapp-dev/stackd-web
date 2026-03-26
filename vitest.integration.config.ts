import { defineConfig } from "vitest/config";
import { resolve } from "path";
import dotenv from "dotenv";

// Load .env file for integration tests (TEST_PRIVATE_KEY, etc.)
dotenv.config();

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["test/integration/**/*.test.ts"],
        testTimeout: 120_000, // 2 minutes — mainnet transactions can be slow
        hookTimeout: 60_000,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});
