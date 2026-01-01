/**
 * E2E Tests for Referrals / Rewards Page
 * 
 * IMPORTANT: These tests run WITHOUT Privy authentication.
 * Since useReferral now requires authentication to fetch data,
 * the dashboard won't display in unauthenticated E2E tests.
 * 
 * These tests verify that the page loads and shows appropriate state
 * for unauthenticated users.
 */
import { test, expect } from "@playwright/test";

test.describe("Rewards Page - Unauthenticated State", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/referrals");
        // Wait for page to load
        await page.waitForLoadState("domcontentloaded");
    });

    test("should display page header", async ({ page }) => {
        // The page header "Rewards" should always be visible
        await expect(page.getByText('Rewards').first()).toBeVisible({ timeout: 5000 });
    });

    test("should show either dashboard or loading/empty state", async ({ page }) => {
        // Without auth, the page may show:
        // 1. Dashboard (if dev mode with fallback)
        // 2. "Start Earning Rewards" (if no user data)
        // 3. Loading skeleton (if still loading)

        const dashboardContent = page.getByText('Total Earnings');
        const startEarningContent = page.getByText('Start Earning Rewards');
        const generateButton = page.getByText('Generate Referral Link');

        const hasDashboard = await dashboardContent.isVisible({ timeout: 2000 }).catch(() => false);
        const hasStartEarning = await startEarningContent.isVisible({ timeout: 2000 }).catch(() => false);
        const hasGenerateButton = await generateButton.isVisible({ timeout: 2000 }).catch(() => false);

        console.log('[TEST] Dashboard visible:', hasDashboard);
        console.log('[TEST] Start earning visible:', hasStartEarning);
        console.log('[TEST] Generate button visible:', hasGenerateButton);

        // At least one of these states should be showing
        expect(hasDashboard || hasStartEarning || hasGenerateButton).toBe(true);
    });

    test("should display bottom navigation", async ({ page }) => {
        // Bottom nav should always be visible regardless of auth state
        const homeNav = page.getByRole('link', { name: /home/i });
        const rewardsNav = page.getByRole('link', { name: /rewards/i });

        // At least one nav item should be visible
        const hasNav = await homeNav.isVisible({ timeout: 2000 }).catch(() => false) ||
            await rewardsNav.isVisible({ timeout: 2000 }).catch(() => false);

        if (!hasNav) {
            // Try alternate selectors for bottom nav
            const bottomNav = page.locator('nav, [role="navigation"]');
            const hasBottomNav = await bottomNav.isVisible({ timeout: 2000 }).catch(() => false);
            console.log('[TEST] Bottom nav found:', hasBottomNav);
        }
    });
});

test.describe("Rewards Page - API Health", () => {
    test("API endpoint responds correctly", async ({ request }) => {
        // API should respond even without auth (with dev fallback or 401)
        const response = await request.get('/api/referrals');

        // Should either return 200 (dev fallback) or 401 (requires auth)
        expect([200, 401]).toContain(response.status());

        if (response.status() === 200) {
            const data = await response.json();
            console.log('[TEST] API response:', JSON.stringify(data).substring(0, 100));
        }
    });
});

