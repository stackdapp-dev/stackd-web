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

    test('Terms of Service opens external link in new tab', async ({ page }) => {
        // Intercept window.open calls
        const openedUrls: string[] = [];
        await page.exposeFunction('captureWindowOpen', (url: string) => {
            openedUrls.push(url);
        });
        await page.addInitScript(() => {
            window.open = (url?: string | URL) => {
                if (url) (window as any).captureWindowOpen(url.toString());
                return null;
            };
        });

        // Reload to apply the init script
        await page.goto('/menu');
        await page.waitForSelector('h1:has-text("Menu")');

        // Click Terms of Service
        await page.getByText('Terms of Service').click();

        // Verify the correct URL was passed to window.open
        expect(openedUrls).toContain('https://www.stackdapp.co/terms');
    });

    test('Privacy Policy opens external link in new tab', async ({ page }) => {
        // Intercept window.open calls
        const openedUrls: string[] = [];
        await page.exposeFunction('captureWindowOpen', (url: string) => {
            openedUrls.push(url);
        });
        await page.addInitScript(() => {
            window.open = (url?: string | URL) => {
                if (url) (window as any).captureWindowOpen(url.toString());
                return null;
            };
        });

        // Reload to apply the init script
        await page.goto('/menu');
        await page.waitForSelector('h1:has-text("Menu")');

        // Click Privacy Policy
        await page.getByText('Privacy Policy').click();

        // Verify the correct URL was passed to window.open
        expect(openedUrls).toContain('https://www.stackdapp.co/privacy');
    });

    test('menu items have correct icons', async ({ page }) => {
        // Each menu item should have an icon in a rounded container
        const menuItems = page.locator('li .w-10.h-10.rounded-full');

        // Should have 5 menu items total
        await expect(menuItems).toHaveCount(5);
    });
});
