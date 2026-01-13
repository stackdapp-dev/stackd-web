import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load .env file so env vars are available
dotenv.config();

export default defineConfig({
    testDir: "./test/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    timeout: 30000,
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        // Mobile Safari commented out for faster initial testing
        // {
        //   name: "Mobile Safari",
        //   use: { ...devices["iPhone 13"] },
        // },
    ],
    webServer: {
        command: "node node_modules/next/dist/bin/next dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
            NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "test-app-id",
            NEXT_PUBLIC_PRIVY_SIGNER_ID: process.env.NEXT_PUBLIC_PRIVY_SIGNER_ID || "test-signer-id",
            NEXT_PUBLIC_TOKEN_PRICE_API_BASE_URL: process.env.NEXT_PUBLIC_TOKEN_PRICE_API_BASE_URL || "https://api.test.com",
            NEXT_PUBLIC_OPENWIDGET_ORG_ID: process.env.NEXT_PUBLIC_OPENWIDGET_ORG_ID || "test-org-id",
            NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "test-project-id",
        },
    },
});
