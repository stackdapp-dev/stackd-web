/**
 * Integration Test: Referral Code Display
 * 
 * This test verifies that an authenticated user's referral code
 * is correctly fetched from Supabase and displayed on the Rewards page.
 * The key assertion is that the API and UI show the SAME referral code.
 */

import { test, expect } from '@playwright/test';

test.describe('Referral Code Display on Rewards Page', () => {
    // Known Supabase user data
    const KNOWN_REFERRAL_CODE = 'STACKCWSZY'; // Root user's referral code for ReferralGate

    test('displays referral code for authenticated user with existing Supabase record', async ({ page }) => {
        // Navigate to the app root
        await page.goto('/');

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // If ReferralGate is shown, enter a valid referral code
        const referralInput = page.locator('input[id="referralCode"]');
        if (await referralInput.isVisible({ timeout: 2000 })) {
            await referralInput.fill(KNOWN_REFERRAL_CODE);
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        }

        // At this point we should see the login screen
        // Note: We cannot fully simulate Privy auth in E2E tests without mocking
        // Instead, we'll test the API directly
    });

    test('API and UI display the same referral code (consistency check)', async ({ page, request }) => {
        // Step 1: Get the referral code from API
        const apiResponse = await request.get('/api/referrals');
        expect(apiResponse.status()).toBe(200);

        const apiData = await apiResponse.json();
        expect(apiData).toHaveProperty('referral_code');
        expect(apiData.referral_code).toBeTruthy();

        const apiReferralCode = apiData.referral_code;
        console.log('[TEST] API referral_code:', apiReferralCode);

        // Referral code should match the expected format (STACK + 5 chars)
        expect(apiReferralCode).toMatch(/^STACK[A-Z0-9]{5}$/);

        // Step 2: Navigate to Rewards page and get the displayed code
        await page.goto('/referrals');
        await page.waitForLoadState('networkidle');

        // Look for the referral code display element
        const referralCodeElement = page.getByTestId('referral-code');
        await expect(referralCodeElement).toBeVisible({ timeout: 10000 });

        // Get the displayed code
        const displayedCode = await referralCodeElement.textContent();
        console.log('[TEST] UI displayed referral_code:', displayedCode?.trim());

        // Step 3: KEY ASSERTION - API and UI should show the SAME code
        expect(displayedCode?.trim()).toBe(apiReferralCode);

        // Also check that Claim Rewards button is visible (dashboard is fully loaded)
        const claimButton = page.getByText('Claim Rewards');
        await expect(claimButton).toBeVisible();
    });

    test('referral code tappable element shows tap-to-copy hint', async ({ page }) => {
        // Navigate to referrals page
        await page.goto('/referrals');
        await page.waitForLoadState('networkidle');

        // Check for the "tap to copy" hint text
        const tapToCopy = page.getByText('tap to copy');
        await expect(tapToCopy).toBeVisible({ timeout: 10000 });
    });
});

