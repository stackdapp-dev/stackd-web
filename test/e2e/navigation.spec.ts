/**
 * E2E Tests for Navigation
 */
import { test, expect } from "@playwright/test";
import { createMockAuthScript } from "./fixtures";

test.describe("Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(createMockAuthScript("embeddedNoLoan"));
    });

    test("should navigate between main pages", async ({ page }) => {
        // Navigate to wallet
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");
        expect(page.url()).toContain("/wallet");

        // Navigate to history
        await page.goto("/history");
        await page.waitForLoadState("domcontentloaded");
        expect(page.url()).toContain("/history");

        // Navigate to menu
        await page.goto("/menu");
        await page.waitForLoadState("domcontentloaded");
        expect(page.url()).toContain("/menu");
    });

    test("bottom nav should have navigation items", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        const content = await page.content();
        expect(content).toContain("Wallet");
        expect(content).toContain("History");
        expect(content).toContain("Menu");
    });
});
