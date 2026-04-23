/**
 * E2E Tests for Splash Screen
 * Tests the initial splash screen with animated stacking lines that shows
 * before the referral gate or login screen
 */
import { test, expect } from "@playwright/test";
import { clearMockAuthScript } from "./fixtures";

test.describe("Splash Screen - Initial Load", () => {
    test.beforeEach(async ({ page }) => {
        // Clear any mock auth to ensure we see the full flow
        await page.addInitScript(clearMockAuthScript);
        // Clear localStorage to ensure splash shows
        await page.addInitScript(() => {
            localStorage.removeItem("stackd_splash_shown");
            localStorage.removeItem("stackd_referral_code");
        });
    });

    test("should display splash screen as the first page", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const splashScreen = page.getByTestId("splash-screen");
        await expect(splashScreen).toBeVisible();
    });

    test("should have black background on splash screen", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const splashScreen = page.getByTestId("splash-screen");
        await expect(splashScreen).toBeVisible();
        await expect(splashScreen).toHaveCSS("background-color", "rgb(0, 0, 0)");
    });

    test("should display animated stacking lines", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const splashScreen = page.getByTestId("splash-screen");
        await expect(splashScreen).toBeVisible();

        // Check for the animation container
        const animationContainer = page.getByTestId("splash-animation-container");
        await expect(animationContainer).toBeVisible();

        // Check for the stacking lines
        const stackingLines = page.getByTestId("splash-stacking-line");
        await expect(stackingLines).toHaveCount(4);
    });

    test("splash animation container should be centered and occupy 25% of viewport", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const splashScreen = page.getByTestId("splash-screen");
        await expect(splashScreen).toBeVisible();

        // Check that splash screen covers full viewport using fixed positioning
        await expect(splashScreen).toHaveCSS("position", "fixed");
        await expect(splashScreen).toHaveCSS("inset", "0px");

        // Animation container should be positioned slightly above center
        const animationContainer = page.getByTestId("splash-animation-container");
        await expect(animationContainer).toBeVisible();
    });
});

test.describe("Splash Screen - Animation Flow", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(clearMockAuthScript);
        await page.addInitScript(() => {
            localStorage.removeItem("stackd_splash_shown");
            localStorage.removeItem("stackd_referral_code");
        });
    });

    test("should fade out and show referral gate after animation completes", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        // Splash should be visible initially
        const splashScreen = page.getByTestId("splash-screen");
        await expect(splashScreen).toBeVisible();

        // Wait for animation to complete and splash to fade out
        // The animation runs for about 2.7s (1.2s delay + 0.6s animation per line * 4 + fade)
        // Plus fade out time of about 0.5s
        await expect(splashScreen).toBeHidden({ timeout: 5000 });

        // Referral gate should now be visible
        const referralGate = page.getByText("Join ArCa");
        await expect(referralGate).toBeVisible({ timeout: 2000 });
    });

    test("should transition to login screen if referral already validated", async ({ page }) => {
        // Set referral as already validated
        await page.addInitScript(() => {
            localStorage.setItem("stackd_referral_code", "STACKTEST1");
        });

        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        // Splash should be visible initially
        const splashScreen = page.getByTestId("splash-screen");
        await expect(splashScreen).toBeVisible();

        // Wait for animation to complete and splash to fade out
        await expect(splashScreen).toBeHidden({ timeout: 5000 });

        // Login screen should now be visible
        const loginScreen = page.getByTestId("login-container");
        await expect(loginScreen).toBeVisible({ timeout: 2000 });
    });
});

test.describe("Splash Screen - Session Behavior", () => {
    test("should not show splash screen on subsequent visits in same session", async ({ page }) => {
        // First clear everything
        await page.addInitScript(clearMockAuthScript);
        await page.addInitScript(() => {
            localStorage.removeItem("stackd_splash_shown");
            localStorage.removeItem("stackd_referral_code");
        });

        // First visit - splash should show
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const splashScreen = page.getByTestId("splash-screen");
        await expect(splashScreen).toBeVisible();

        // Wait for splash to complete
        await expect(splashScreen).toBeHidden({ timeout: 5000 });

        // Referral gate should be visible
        const referralGate = page.getByText("Join ArCa");
        await expect(referralGate).toBeVisible({ timeout: 2000 });

        // Refresh the page
        await page.reload();
        await page.waitForLoadState("domcontentloaded");

        // Splash should NOT show on second visit (session storage should prevent it)
        // Should go directly to referral gate
        await expect(page.getByText("Join ArCa")).toBeVisible({ timeout: 2000 });
        await expect(page.getByTestId("splash-screen")).not.toBeVisible();
    });
});
