/**
 * E2E Tests for Referrals / Rewards Page
 * 
 * Since auto-generation of referral codes on login is implemented,
 * the page now shows the full dashboard instead of the "Generate" screen.
 */
import { test, expect } from "@playwright/test";

test.describe("Rewards Page Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/referrals");
        // Wait for the loading spinner to disappear and content to appear
        await page.waitForSelector('text=Total Earnings', { timeout: 15000 }).catch(() => { });
        // Additional wait for hydration
        await page.waitForTimeout(500);
    });

    test("should display Total Earnings header", async ({ page }) => {
        await expect(page.locator('text=Total Earnings')).toBeVisible({ timeout: 10000 });
    });

    test("should display Inflation Avoided metric", async ({ page }) => {
        await expect(page.locator('text=Inflation Avoided')).toBeVisible({ timeout: 10000 });
    });

    test("should display Referral Rewards metric", async ({ page }) => {
        await expect(page.locator('text=Referral Rewards')).toBeVisible({ timeout: 10000 });
    });

    test("should display Claim Rewards button", async ({ page }) => {
        await expect(page.locator('text=Claim Rewards')).toBeVisible({ timeout: 10000 });
    });

    test("should display user tier badge", async ({ page }) => {
        // Check for any tier badge
        const tierBadge = page.locator('text=/Bronze Tier|Silver Tier|Gold Tier|Platinum Tier|Black Tier/');
        await expect(tierBadge.first()).toBeVisible({ timeout: 10000 });
    });

    test("should display Copy Link button", async ({ page }) => {
        await expect(page.locator('text=Copy Link')).toBeVisible({ timeout: 10000 });
    });

    test("should display tier progress", async ({ page }) => {
        await expect(page.locator('text=Progress to Gold')).toBeVisible({ timeout: 10000 });
    });
});
