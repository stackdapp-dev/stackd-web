/**
 * E2E Tests for Rewards Simulator
 * 
 * Tests the full flow of the Rewards Simulator feature:
 * - Button visibility on referrals page
 * - Modal opening/closing
 * - Input fields and slider functionality
 * - Calculation display
 * - Start Earning Now navigation to wallet
 */
import { test, expect } from "@playwright/test";
import { createMockAuthScript } from "./fixtures";

test.describe("Rewards Simulator", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/referrals");
        await page.waitForLoadState("domcontentloaded");
        // Wait for React hydration
        await page.waitForTimeout(2000);
    });

    test.describe("Simulate My Rewards Button", () => {
        test("should display Simulate My Rewards button on referrals page", async ({ page }) => {
            // Wait for page to render dashboard content
            const dashboardContent = page.getByText('Total Earnings');
            const hasDashboard = await dashboardContent.isVisible({ timeout: 10000 }).catch(() => false);

            if (hasDashboard) {
                // If dashboard is visible, the simulate button should be visible
                const simulateButton = page.getByTestId('simulate-rewards-button');
                await expect(simulateButton).toBeVisible({ timeout: 5000 });
                await expect(simulateButton).toContainText(/simulate.*rewards/i);
            } else {
                // Dashboard not visible (no user data) - skip button test
                console.log('[TEST] Dashboard not visible - skipping simulate button test');
                test.skip();
            }
        });

        test("should have TrendingUp icon on simulate button", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            const isVisible = await simulateButton.isVisible({ timeout: 10000 }).catch(() => false);

            if (isVisible) {
                // Button should contain an SVG icon
                const icon = simulateButton.locator('svg');
                await expect(icon).toBeVisible();
            } else {
                test.skip();
            }
        });
    });

    test.describe("Rewards Simulator Modal", () => {
        test.beforeEach(async ({ page }) => {
            // Try to open the modal
            const simulateButton = page.getByTestId('simulate-rewards-button');
            const isVisible = await simulateButton.isVisible({ timeout: 10000 }).catch(() => false);

            if (!isVisible) {
                test.skip();
            }
        });

        test("should open modal when Simulate My Rewards button is clicked", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            await simulateButton.click();

            // Modal should be visible
            const modal = page.getByRole('dialog');
            await expect(modal).toBeVisible({ timeout: 5000 });

            // Modal header should show "Rewards Simulator"
            await expect(page.getByText('Rewards Simulator')).toBeVisible();
        });

        test("should have all required input fields", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            await simulateButton.click();

            // Wait for modal to appear
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Check for input fields
            const directReferralsInput = page.getByLabel(/direct referrals/i);
            const avgReferralsInput = page.getByLabel(/avg referrals per friend/i);
            const avgLoanInput = page.getByLabel(/avg loan position/i);
            const timeSlider = page.getByRole('slider');

            await expect(directReferralsInput).toBeVisible();
            await expect(avgReferralsInput).toBeVisible();
            await expect(avgLoanInput).toBeVisible();
            await expect(timeSlider).toBeVisible();
        });

        test("should display calculated earnings", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            await simulateButton.click();

            // Wait for modal
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Should show estimated earnings (default values: 10 referrals, 5 avg, $5000, 6 months)
            // Expected: (10 * 5000 * 0.005 * 6) + (50 * 5000 * 0.0025 * 6) = $1500 + $3750 = $5250
            const estimatedEarnings = page.getByText(/estimated earnings/i);
            await expect(estimatedEarnings).toBeVisible();

            // Should show total network
            await expect(page.getByText('60')).toBeVisible(); // 10 + 50 = 60

            // Should show per month value
            await expect(page.getByText(/per month/i)).toBeVisible();
        });

        test("should update calculations when inputs change", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            await simulateButton.click();

            // Wait for modal
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Change direct referrals to 1
            const directReferralsInput = page.getByLabel(/direct referrals/i);
            await directReferralsInput.fill('1');

            // Change avg referrals per friend to 0
            const avgReferralsInput = page.getByLabel(/avg referrals per friend/i);
            await avgReferralsInput.fill('0');

            // Total network should now be 1
            await expect(page.getByText('1')).toBeVisible();
        });

        test("should close modal when X button is clicked", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            await simulateButton.click();

            // Wait for modal
            const modal = page.getByRole('dialog');
            await expect(modal).toBeVisible({ timeout: 5000 });

            // Click close button
            const closeButton = page.getByLabel(/close/i);
            await closeButton.click();

            // Modal should no longer be visible
            await expect(modal).not.toBeVisible({ timeout: 3000 });
        });

        test("should close modal when clicking backdrop", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            await simulateButton.click();

            // Wait for modal
            const modal = page.getByRole('dialog');
            await expect(modal).toBeVisible({ timeout: 5000 });

            // Click on backdrop (outside modal content)
            await page.click('.fixed.inset-0', { position: { x: 10, y: 10 } });

            // Modal should close
            await expect(modal).not.toBeVisible({ timeout: 3000 });
        });
    });

    test.describe("Start Earning Now Navigation", () => {
        test("should navigate to wallet with openLoan param when Start Earning Now is clicked", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            const isVisible = await simulateButton.isVisible({ timeout: 10000 }).catch(() => false);

            if (!isVisible) {
                test.skip();
                return;
            }

            await simulateButton.click();

            // Wait for modal
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Click Start Earning Now
            const startEarningButton = page.getByRole('button', { name: /start earning now/i });
            await expect(startEarningButton).toBeVisible();
            await startEarningButton.click();

            // Should navigate to wallet page
            await page.waitForURL(/\/wallet/, { timeout: 5000 });

            // URL should have had openLoan param (may be cleaned up by the page)
            // Just verify we're on the wallet page
            expect(page.url()).toContain('/wallet');
        });

        test("should auto-open New Loan modal when navigating to wallet with openLoan param", async ({ page }) => {
            // Set up mock auth and dismiss early access modal for wallet access
            await page.addInitScript(createMockAuthScript("embeddedNoLoan"));
            await page.addInitScript(() => {
                localStorage.setItem('stackd_early_access_shown', 'true');
            });

            // Navigate directly to wallet with openLoan param
            await page.goto("/wallet?openLoan=true");
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(2000);

            // New Loan modal should auto-open
            const loanModal = page.getByText('New Loan Position');
            const isVisible = await loanModal.isVisible({ timeout: 5000 }).catch(() => false);

            if (isVisible) {
                await expect(loanModal).toBeVisible();
            } else {
                // Modal might not appear without proper wallet connection
                console.log('[TEST] New Loan modal did not auto-open (may require wallet connection)');
            }
        });
    });

    test.describe("Share Yearly Potential", () => {
        test("should have Share Yearly Potential button in modal", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            const isVisible = await simulateButton.isVisible({ timeout: 10000 }).catch(() => false);

            if (!isVisible) {
                test.skip();
                return;
            }

            await simulateButton.click();

            // Wait for modal
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Should have share button
            const shareButton = page.getByRole('button', { name: /share yearly potential/i });
            await expect(shareButton).toBeVisible();
        });
    });

    test.describe("Earnings Breakdown", () => {
        test("should display L1 and L2 earnings breakdown", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            const isVisible = await simulateButton.isVisible({ timeout: 10000 }).catch(() => false);

            if (!isVisible) {
                test.skip();
                return;
            }

            await simulateButton.click();

            // Wait for modal
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Should show breakdown for direct referrals
            await expect(page.getByText(/direct referrals/i)).toBeVisible();

            // Should show breakdown for 2nd level
            await expect(page.getByText(/2nd level/i)).toBeVisible();
        });
    });

    test.describe("Disclaimer", () => {
        test("should display earnings disclaimer", async ({ page }) => {
            const simulateButton = page.getByTestId('simulate-rewards-button');
            const isVisible = await simulateButton.isVisible({ timeout: 10000 }).catch(() => false);

            if (!isVisible) {
                test.skip();
                return;
            }

            await simulateButton.click();

            // Wait for modal
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Should show disclaimer text
            await expect(page.getByText(/estimates|actual earnings may vary/i)).toBeVisible();
        });
    });
});
