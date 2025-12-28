import { test, expect } from '@playwright/test';

test.describe('Menu Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to menu page
        await page.goto('/menu');
        // Wait for page to load
        await page.waitForSelector('h1:has-text("Menu")');
    });

    test('displays all menu items', async ({ page }) => {
        // Check Withdraw
        await expect(page.getByText('Withdraw')).toBeVisible();

        // Check Contact Us
        await expect(page.getByText('Contact Us')).toBeVisible();

        // Check Profile
        await expect(page.getByText('Profile')).toBeVisible();

        // Check Terms of Service
        await expect(page.getByText('Terms of Service')).toBeVisible();

        // Check Privacy Policy
        await expect(page.getByText('Privacy Policy')).toBeVisible();
    });

    test('Terms of Service opens external link in new tab', async ({ page, context }) => {
        // Listen for new page (tab) to open
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            page.getByText('Terms of Service').click(),
        ]);

        // Verify the new tab URL
        await newPage.waitForLoadState();
        expect(newPage.url()).toContain('stackdapp.co/terms');
    });

    test('Privacy Policy opens external link in new tab', async ({ page, context }) => {
        // Listen for new page (tab) to open
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            page.getByText('Privacy Policy').click(),
        ]);

        // Verify the new tab URL
        await newPage.waitForLoadState();
        expect(newPage.url()).toContain('stackdapp.co/privacy');
    });

    test('menu items have correct icons', async ({ page }) => {
        // Each menu item should have an icon in a rounded container
        const menuItems = page.locator('li .w-10.h-10.rounded-full');

        // Should have 5 menu items total
        await expect(menuItems).toHaveCount(5);
    });
});
