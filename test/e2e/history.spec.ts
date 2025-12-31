/**
 * E2E Tests for History Page
 */
import { test, expect } from "@playwright/test";
import { createMockAuthScript } from "./fixtures";

test.describe("History Page", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(createMockAuthScript("embeddedWithLoan"));
    });

    test("should display History title", async ({ page }) => {
        await page.goto("/history");
        await page.waitForLoadState("domcontentloaded");

        const content = await page.content();
        expect(content).toContain("History");
    });

    test("should have page content", async ({ page }) => {
        await page.goto("/history");
        await page.waitForLoadState("domcontentloaded");

        const content = await page.content();
        // Check page has meaningful content
        expect(content.length).toBeGreaterThan(1000);
    });
});
