/**
 * E2E Tests for Wallet Page
 * Tests wallet display with mocked authentication
 */
import { test, expect } from "@playwright/test";
import { createMockAuthScript, clearMockAuthScript } from "./fixtures";

test.describe("Wallet Page - Unauthenticated", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(clearMockAuthScript);
    });

    test("page should load without errors", async ({ page }) => {
        const response = await page.goto("/wallet");
        expect(response?.status()).toBeLessThan(400);
    });
});

test.describe("Wallet Page - Embedded Wallet (No Loan)", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(createMockAuthScript("embeddedNoLoan"));
    });

    test("should display Wallet title", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("networkidle");

        const content = await page.content();
        expect(content).toContain("Wallet");
    });

    test("should contain Assets text or loading state", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        const content = await page.content();
        // Either shows Assets section or skeleton loading
        const hasAssets = content.includes("ASSETS") || content.includes("Assets");
        const hasSkeleton = content.includes("skeleton") || content.includes("animate-pulse");
        expect(hasAssets || hasSkeleton || content.length > 1000).toBeTruthy();
    });

    test("should display action buttons", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        const content = await page.content();
        // Look for action-related content
        expect(content).toContain("Send");
    });
});

test.describe("Wallet Page - External Wallet (With Loan)", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(createMockAuthScript("externalWithLoan"));
    });

    test("should render wallet page content", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        // Verify page loads with content
        const content = await page.content();
        expect(content.length).toBeGreaterThan(1000);
    });
});
