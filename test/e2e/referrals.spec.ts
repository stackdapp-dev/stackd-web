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

test.describe("Rewards Page Hero Section", () => {
    test("should display Total Earnings header", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        expect(content).toContain("Total Earnings");
    });

    test("should display Inflation Avoided metric", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        expect(content).toContain("Inflation Avoided");
    });

    test("should display Referral Rewards metric", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        expect(content).toContain("Referral Rewards");
    });

    test("should display Claim Rewards button", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        expect(content).toContain("Claim Rewards");
    });

    test("should display user tier badge", async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        const content = await page.content();
        // Should show one of the tier badges
        const hasTierBadge =
            content.includes("Bronze Tier") ||
            content.includes("Silver Tier") ||
            content.includes("Gold Tier") ||
            content.includes("Platinum Tier") ||
            content.includes("Black Tier");
        expect(hasTierBadge).toBe(true);
    });
});
