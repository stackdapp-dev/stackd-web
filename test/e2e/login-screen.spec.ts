/**
 * E2E Tests for Login Screen
 * Tests the redesigned login view with badges, icons, and improved layout
 */
import { test, expect } from "@playwright/test";
import { clearMockAuthScript } from "./fixtures";

test.describe("Login Screen - UI Elements", () => {
    test.beforeEach(async ({ page }) => {
        // Clear any mock auth to ensure we see the login screen
        await page.addInitScript(clearMockAuthScript);
        // Set localStorage to bypass referral gate and sessionStorage to bypass splash screen
        await page.addInitScript(() => {
            localStorage.setItem("stackd_referral_code", "STACKTEST1");
            sessionStorage.setItem("stackd_splash_shown", "true");
        });
    });

    test("should display the ALPHA badge at the top", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const betaBadge = page.getByTestId("login-beta-badge");
        await expect(betaBadge).toBeVisible();
        await expect(betaBadge).toContainText("ALPHA");
    });

    test("should display the Stack'd logo", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const logo = page.getByAltText("Stack'd Logo");
        await expect(logo).toBeVisible();
    });

    test("should display Connect External Wallet as primary button with icon", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const walletButton = page.getByTestId("login-wallet-button");
        await expect(walletButton).toBeVisible();
        await expect(walletButton).toContainText("Connect External Wallet");

        // Check for wallet icon
        const walletIcon = page.getByTestId("login-wallet-icon");
        await expect(walletIcon).toBeVisible();

        // Wallet button should NOT have a badge (RECOMMENDED badge removed)
        const walletBadge = page.getByTestId("login-wallet-badge");
        await expect(walletBadge).not.toBeVisible();
    });

    test("should display Other Login Options dropdown button", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const otherOptionsButton = page.getByTestId("login-other-options-button");
        await expect(otherOptionsButton).toBeVisible();
        await expect(otherOptionsButton).toContainText("Other Login Options");

        // Check for chevron icon
        const chevronIcon = page.getByTestId("login-other-options-chevron");
        await expect(chevronIcon).toBeVisible();
    });

    test("should hide Email and Passkey buttons by default", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        // Email and Passkey buttons should NOT be visible initially
        const emailButton = page.getByTestId("login-email-button");
        await expect(emailButton).not.toBeVisible();

        const passkeyButton = page.getByTestId("login-passkey-button");
        await expect(passkeyButton).not.toBeVisible();
    });

    test("should show Email and Passkey buttons when dropdown is expanded", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        // Click to expand dropdown
        const otherOptionsButton = page.getByTestId("login-other-options-button");
        await otherOptionsButton.click();

        // Email button should now be visible with BETA badge
        const emailButton = page.getByTestId("login-email-button");
        await expect(emailButton).toBeVisible();
        await expect(emailButton).toContainText("Login with Email");

        const emailBadge = page.getByTestId("login-email-badge");
        await expect(emailBadge).toBeVisible();
        await expect(emailBadge).toContainText("BETA");

        const emailIcon = page.getByTestId("login-email-icon");
        await expect(emailIcon).toBeVisible();

        // Passkey button should now be visible with BETA badge
        const passkeyButton = page.getByTestId("login-passkey-button");
        await expect(passkeyButton).toBeVisible();
        await expect(passkeyButton).toContainText("Login with Passkey");

        const passkeyBadge = page.getByTestId("login-passkey-badge");
        await expect(passkeyBadge).toBeVisible();
        await expect(passkeyBadge).toContainText("BETA");

        const passkeyIcon = page.getByTestId("login-passkey-icon");
        await expect(passkeyIcon).toBeVisible();
    });

    test("should display Terms of Service and Privacy Policy links", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const tosLink = page.getByRole("link", { name: "Terms of Service" });
        await expect(tosLink).toBeVisible();

        const privacyLink = page.getByRole("link", { name: "Privacy Policy" });
        await expect(privacyLink).toBeVisible();
    });

    test("should have correct button order: wallet first, then other options", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const buttonContainer = page.getByTestId("login-buttons-container");
        await expect(buttonContainer).toBeVisible();

        // Get visible buttons in order (dropdown collapsed)
        const buttons = buttonContainer.locator("> button");
        await expect(buttons).toHaveCount(2);

        // Verify order by checking text content
        await expect(buttons.nth(0)).toContainText("Connect External Wallet");
        await expect(buttons.nth(1)).toContainText("Other Login Options");
    });

    test("buttons should be clickable and trigger login flow", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        // Wallet button should be clickable
        const walletButton = page.getByTestId("login-wallet-button");
        await expect(walletButton).toBeEnabled();

        // Other options button should be clickable
        const otherOptionsButton = page.getByTestId("login-other-options-button");
        await expect(otherOptionsButton).toBeEnabled();

        // Expand dropdown to access email and passkey
        await otherOptionsButton.click();

        // Email button should be clickable after expanding
        const emailButton = page.getByTestId("login-email-button");
        await expect(emailButton).toBeEnabled();

        // Passkey button should be clickable after expanding
        const passkeyButton = page.getByTestId("login-passkey-button");
        await expect(passkeyButton).toBeEnabled();
    });
});

test.describe("Login Screen - Layout", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(clearMockAuthScript);
        // Set localStorage to bypass referral gate and sessionStorage to bypass splash screen
        await page.addInitScript(() => {
            localStorage.setItem("stackd_referral_code", "STACKTEST1");
            sessionStorage.setItem("stackd_splash_shown", "true");
        });
    });

    test("should have proper vertical layout with centered content", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const loginContainer = page.getByTestId("login-container");
        await expect(loginContainer).toBeVisible();

        // Container should have flex column layout with centered items
        await expect(loginContainer).toHaveCSS("display", "flex");
        await expect(loginContainer).toHaveCSS("flex-direction", "column");
        await expect(loginContainer).toHaveCSS("align-items", "center");
    });
});
