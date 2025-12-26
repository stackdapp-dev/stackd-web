/**
 * E2E Tests for History Page
 * Tests basic page loading (requires no auth)
 */
import { test, expect } from "@playwright/test";

test.describe("History Page - Basic", () => {
    test("page should load without errors", async ({ page }) => {
        const response = await page.goto("/history");

        expect(response?.status()).toBeLessThan(400);
    });

    test("should display History in page content", async ({ page }) => {
        await page.goto("/history");
        await page.waitForLoadState("networkidle");

        const content = await page.content();
        expect(content).toContain("History");
    });
});
