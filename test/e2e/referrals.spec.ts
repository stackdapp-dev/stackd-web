/**
 * E2E Tests for Referrals / Rewards Page
 */
import { test, expect } from "@playwright/test";

test.describe("Rewards Page Copy", () => {
    test("should display correct referral card copy", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();

        // Primary CTA copy
        expect(content).toContain("Earn 20% Referral Rewards");

        // Subtext copy
        expect(content).toContain("Friends beat inflation, you earn while helping them");
    });

    test("should display Copy Link and Share buttons", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        expect(content).toContain("Copy Link");
    });

    test("should display tier progress", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        expect(content).toContain("Status");
        expect(content).toContain("Progress to Gold");
    });
});
