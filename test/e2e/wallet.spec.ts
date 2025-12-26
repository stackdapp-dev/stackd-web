/**
 * E2E Tests for Wallet Page
 * Tests basic page structure and unauthenticated flows
 * 
 * Note: Authenticated flows require app-side test mode integration.
 * These tests verify the app loads correctly and handles auth states.
 */
import { test, expect } from "@playwright/test";

test.describe("Wallet Page - Basic", () => {
    test("page should load without errors", async ({ page }) => {
        const response = await page.goto("/wallet");

        // Page should return successfully (200, 301, 302 are ok)
        expect(response?.status()).toBeLessThan(400);
    });

    test("should have proper page title", async ({ page }) => {
        await page.goto("/wallet");

        // Should have a title
        const title = await page.title();
        expect(title).toBeTruthy();
    });

    test("should display some UI content", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Page should have visible content
        const bodyContent = await page.locator("body").textContent();
        expect(bodyContent?.length).toBeGreaterThan(0);
    });
});

test.describe("Wallet Page - Unauthenticated State", () => {
    test("should show login/auth UI when not authenticated", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // Check if either shows login prompt OR redirects to login
        // The exact behavior depends on app routing
        const currentUrl = page.url();
        const pageContent = await page.content();

        // Either redirected away OR shows some form of auth UI
        const hasAuthUI = pageContent.includes("Sign in")
            || pageContent.includes("Log in")
            || pageContent.includes("Connect")
            || pageContent.includes("privy")
            || !currentUrl.includes("/wallet");

        expect(hasAuthUI || currentUrl !== page.url()).toBeTruthy();
    });
});
