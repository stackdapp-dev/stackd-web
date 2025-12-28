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
        // Wait for either loading to finish or dashboard content to appear
        // Using a compound wait to handle slow hydration
        await Promise.race([
            page.waitForSelector('text=Inflation Avoided', { timeout: 20000 }),
            page.waitForSelector('text=Total Earnings', { timeout: 20000 }),
            page.waitForSelector('text=Copy Link', { timeout: 20000 }),
        ]).catch(() => { });
        // Give hydration time to complete
        await page.waitForTimeout(1000);
    });

    test("should display Total Earnings header", async ({ page }) => {
        // Use a more flexible assertion - look for text that contains "Total Earnings"
        await expect(page.getByText('Total Earnings').first()).toBeVisible({ timeout: 10000 });
    });

    test("should display Inflation Avoided metric", async ({ page }) => {
        await expect(page.getByText('Inflation Avoided', { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test("should display Referral Rewards metric", async ({ page }) => {
        await expect(page.getByText('Referral Rewards', { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test("should display Claim Rewards button", async ({ page }) => {
        await expect(page.getByText('Claim Rewards')).toBeVisible({ timeout: 10000 });
    });

    test("should display user tier badge", async ({ page }) => {
        // Check for any tier badge using regex
        const tierBadge = page.getByText(/Bronze Tier|Silver Tier|Gold Tier|Platinum Tier|Black Tier/);
        await expect(tierBadge.first()).toBeVisible({ timeout: 10000 });
    });

    test("should display Copy Link button", async ({ page }) => {
        await expect(page.getByText('Copy Link')).toBeVisible({ timeout: 10000 });
    });

    test("should display tier progress", async ({ page }) => {
        await expect(page.getByText('Progress to Gold')).toBeVisible({ timeout: 10000 });
    });
});
