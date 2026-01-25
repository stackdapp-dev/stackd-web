/**
 * E2E Tests for Navigation
 */
import { test, expect } from "@playwright/test";
import { createMockAuthScript } from "./fixtures";

test.describe("Navigation", () => {
    // Increase timeout for navigation tests
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(createMockAuthScript("embeddedNoLoan"));
        // Dismiss the EarlyAccessModal by setting localStorage before navigation
        await page.addInitScript(() => {
            localStorage.setItem('stackd_early_access_shown', 'true');
        });
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

    test("nav should have core navigation items", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        const content = await page.content();
        // Core nav items present in both mobile and desktop
        expect(content).toContain("Wallet");
        expect(content).toContain("History");
        expect(content).toContain("Rewards");
    });
});

test.describe("Desktop Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(createMockAuthScript("embeddedNoLoan"));
        // Dismiss the EarlyAccessModal by setting localStorage before navigation
        await page.addInitScript(() => {
            localStorage.setItem('stackd_early_access_shown', 'true');
        });
        // Ensure desktop viewport (768px+)
        await page.setViewportSize({ width: 1280, height: 800 });
    });

    test("should display top navbar on desktop", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Wait for React hydration - useMediaQuery initializes as false and updates after effect
        await page.waitForTimeout(1000);

        // Check for top-positioned nav (desktop layout)
        const nav = page.locator("nav");
        await expect(nav).toBeVisible();

        // Desktop nav should have top positioning after hydration
        // The ResponsiveNav component uses 'top-0' class for desktop
        await expect(nav).toHaveClass(/top-/);
    });


    test("should display STACK'D logo on desktop", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Logo should be visible on desktop
        const logo = page.locator('[data-testid="stackd-logo"]');
        await expect(logo).toBeVisible();
    });

    test("should display nav items with labels on desktop", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Desktop shows text labels
        await expect(page.getByRole("button", { name: /wallet/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /history/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /rewards/i })).toBeVisible();
    });

    test("should display Card item on desktop", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Card should be visible on desktop
        const cardButton = page.getByRole("button", { name: /^card$/i });
        await expect(cardButton).toBeVisible();
    });

    test("should highlight active nav item on desktop", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        const walletButton = page.getByRole("button", { name: /wallet/i });
        await expect(walletButton).toBeVisible();

        // Active item should have orange background
        const classes = await walletButton.getAttribute("class");
        expect(classes).toContain("bg-[#ffa02d]");
    });

    test("should navigate when clicking nav items on desktop", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Click History
        await page.getByRole("button", { name: /history/i }).click();
        await page.waitForURL("**/history");
        expect(page.url()).toContain("/history");

        // Click Rewards
        await page.getByRole("button", { name: /rewards/i }).click();
        await page.waitForURL("**/referrals");
        expect(page.url()).toContain("/referrals");
    });
});

test.describe("Mobile Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(createMockAuthScript("embeddedNoLoan"));
        // Dismiss the EarlyAccessModal by setting localStorage before navigation
        await page.addInitScript(() => {
            localStorage.setItem('stackd_early_access_shown', 'true');
        });
        // Set mobile viewport (below 768px)
        await page.setViewportSize({ width: 375, height: 812 });
    });

    test("should display bottom navbar on mobile", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Check for bottom-positioned nav (mobile layout)
        const nav = page.locator("nav");
        await expect(nav).toBeVisible();

        // Mobile nav should have fixed positioning
        const navClasses = await nav.getAttribute("class");
        expect(navClasses).toContain("fixed");
    });

    test("should NOT display logo on mobile", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Logo should not be visible on mobile
        const logo = page.locator('[data-testid="stackd-logo"]');
        await expect(logo).not.toBeVisible();
    });

    test("should display Card item on mobile", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Card should be visible on mobile
        const cardButton = page.getByLabel("Card");
        await expect(cardButton).toBeVisible();
    });

    test("should navigate when clicking nav items on mobile", async ({ page }) => {
        await page.goto("/wallet");
        await page.waitForLoadState("domcontentloaded");

        // Click History
        await page.getByLabel("History").click();
        await page.waitForURL("**/history");
        expect(page.url()).toContain("/history");
    });
});
