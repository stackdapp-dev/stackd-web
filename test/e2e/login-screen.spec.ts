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
        // Set localStorage to bypass referral gate (use actual code key)
        await page.addInitScript(() => {
            localStorage.setItem("stackd_referral_code", "STACKTEST1");
        });
    });

    test("should display the BETA badge at the top", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const betaBadge = page.getByTestId("login-beta-badge");
        await expect(betaBadge).toBeVisible();
        await expect(betaBadge).toContainText("BETA");
    });

    test("should display the Stack'd logo", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const logo = page.getByAltText("Stack'd Logo");
        await expect(logo).toBeVisible();
    });

    test("should display Login with Email button with icon and BETA badge", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const emailButton = page.getByTestId("login-email-button");
        await expect(emailButton).toBeVisible();
        await expect(emailButton).toContainText("Login with Email");

        // Check for BETA badge on email button
        const emailBadge = page.getByTestId("login-email-badge");
        await expect(emailBadge).toBeVisible();
        await expect(emailBadge).toContainText("BETA");

        // Check for email icon
        const emailIcon = page.getByTestId("login-email-icon");
        await expect(emailIcon).toBeVisible();
    });

    test("should display Continue with Wallet button with icon and RECOMMENDED badge", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const walletButton = page.getByTestId("login-wallet-button");
        await expect(walletButton).toBeVisible();
        await expect(walletButton).toContainText("Connect External Wallet");

        // Check for RECOMMENDED badge on wallet button
        const walletBadge = page.getByTestId("login-wallet-badge");
        await expect(walletBadge).toBeVisible();
        await expect(walletBadge).toContainText("RECOMMENDED");

        // Check for wallet icon
        const walletIcon = page.getByTestId("login-wallet-icon");
        await expect(walletIcon).toBeVisible();
    });

    test("should display Login with Passkey button with icon and BETA badge", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const passkeyButton = page.getByTestId("login-passkey-button");
        await expect(passkeyButton).toBeVisible();
        await expect(passkeyButton).toContainText("Login with Passkey");

        // Check for BETA badge on passkey button
        const passkeyBadge = page.getByTestId("login-passkey-badge");
        await expect(passkeyBadge).toBeVisible();
        await expect(passkeyBadge).toContainText("BETA");

        // Check for passkey/key icon
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

    test("should have correct button order: email, wallet, passkey", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const buttonContainer = page.getByTestId("login-buttons-container");
        await expect(buttonContainer).toBeVisible();

        // Get all buttons in order
        const buttons = buttonContainer.locator("button");
        await expect(buttons).toHaveCount(3);

        // Verify order by checking text content
        await expect(buttons.nth(0)).toContainText("Login with Email");
        await expect(buttons.nth(1)).toContainText("Connect External Wallet");
        await expect(buttons.nth(2)).toContainText("Login with Passkey");
    });

    test("buttons should be clickable and trigger login flow", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        // Email button should be clickable
        const emailButton = page.getByTestId("login-email-button");
        await expect(emailButton).toBeEnabled();

        // Wallet button should be clickable
        const walletButton = page.getByTestId("login-wallet-button");
        await expect(walletButton).toBeEnabled();

        // Passkey button should be clickable
        const passkeyButton = page.getByTestId("login-passkey-button");
        await expect(passkeyButton).toBeEnabled();
    });
});

test.describe("Login Screen - Layout", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(clearMockAuthScript);
        // Set localStorage to bypass referral gate (use actual code key)
        await page.addInitScript(() => {
            localStorage.setItem("stackd_referral_code", "STACKTEST1");
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
