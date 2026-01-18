/**
 * Card Page E2E Tests
 * End-to-end tests for Card tab navigation and display
 */
import { test, expect } from '@playwright/test';

test.describe('Card Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('/');
        // Wait for app to load
        await page.waitForLoadState('networkidle');
    });

    test.describe('Navigation', () => {
        test('should display Card tab in navigation', async ({ page }) => {
            // Look for Card tab in the navigation
            const cardTab = page.getByRole('button', { name: /card/i });
            await expect(cardTab).toBeVisible();
        });

        test('should navigate to Card page when Card tab is clicked', async ({ page }) => {
            const cardTab = page.getByRole('button', { name: /card/i });
            await cardTab.click();

            // Should be on the card page
            await expect(page).toHaveURL(/\/card/);
        });

        test('should highlight Card tab as active on card page', async ({ page }) => {
            await page.goto('/card');

            const cardTab = page.getByRole('button', { name: /card/i });
            // Active tab should have orange background
            await expect(cardTab).toHaveClass(/bg-\[#ffa02d\]/);
        });
    });

    test.describe('Card Page Display', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/card');
        });

        test('should display page header with "Card" title', async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Card' })).toBeVisible();
        });

        test('should display "Coming Soon" badge', async ({ page }) => {
            await expect(page.getByText('Coming Soon')).toBeVisible();
        });

        test('should display virtual Visa card', async ({ page }) => {
            // STACK'D logo on card
            await expect(page.getByTestId('stackd-card-logo')).toBeVisible();
            // VISA logo
            await expect(page.getByTestId('visa-logo')).toBeVisible();
            // EMV chip
            await expect(page.getByTestId('emv-chip')).toBeVisible();
        });

        test('should display quick action buttons', async ({ page }) => {
            await expect(page.getByRole('button', { name: /show details/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /card pin/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /lock/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /change limit/i })).toBeVisible();
        });

        test('should display card balance section', async ({ page }) => {
            await expect(page.getByText('CARD BALANCE')).toBeVisible();
            await expect(page.getByText(/LIMIT/)).toBeVisible();
        });

        test('should display recent transactions section', async ({ page }) => {
            await expect(page.getByText('Recent transactions')).toBeVisible();
        });

        test('should display View all transactions button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /view all transactions/i })).toBeVisible();
        });

        test('should display Add to Wallet button', async ({ page }) => {
            // Could be Apple or Google depending on platform
            const walletButton = page.getByRole('button', { name: /add to.*wallet/i });
            await expect(walletButton).toBeVisible();
        });
    });

    test.describe('Wallet Page Menu Button', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/wallet');
        });

        test('should display menu button in wallet header', async ({ page }) => {
            const menuButton = page.getByRole('button', { name: /menu/i });
            await expect(menuButton).toBeVisible();
        });

        test('should open menu dropdown on click', async ({ page }) => {
            const menuButton = page.getByRole('button', { name: /menu/i });
            await menuButton.click();

            await expect(page.getByText('Withdraw')).toBeVisible();
            await expect(page.getByText('Profile')).toBeVisible();
        });

        test('should navigate to withdraw from menu', async ({ page }) => {
            const menuButton = page.getByRole('button', { name: /menu/i });
            await menuButton.click();
            await page.getByText('Withdraw').click();

            await expect(page).toHaveURL(/\/withdraw/);
        });
    });
});
