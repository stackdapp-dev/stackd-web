/**
 * E2E Tests for Referrals / Rewards Page
 * 
 * Note: These tests run without authentication, so they test
 * the unauthenticated/onboarding state of the page.
 */
import { test, expect } from "@playwright/test";

test.describe("Rewards Page - Unauthenticated State", () => {
    test("should display onboarding view for new users", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();

        // Unauthenticated users see the onboarding screen
        expect(content).toContain("Start Earning Rewards");
        expect(content).toContain("Generate Referral Link");
    });

    test("should display rewards page title", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        expect(content).toContain("Rewards");
    });
});

// TODO: Add authenticated tests with mock auth when Privy test mode is set up
// test.describe("Rewards Page - Authenticated State", () => {
//     test.beforeEach(async ({ page }) => {
//         // Set up mock authentication
//     });
//
//     test("should display Total Earnings header", async ({ page }) => { ... });
//     test("should display Claim Rewards button", async ({ page }) => { ... });
//     test("should display user tier badge", async ({ page }) => { ... });
// });
