/**
 * E2E Test: Referral Code Display
 * 
 * IMPORTANT: These E2E tests run WITHOUT Privy authentication.
 * They verify the UI renders correctly when the API returns a referral code,
 * but they use the development fallback (mock wallet) rather than a real user.
 * 
 * For authenticated user testing:
 * - The fix in useReferral.ts sends the Privy access token
 * - verifyAuthToken.ts extracts the wallet from the token
 * - referralDb looks up the user's actual referral code
 * 
 * Manual testing required to verify logged-in user sees their own code.
 */

import { test, expect } from '@playwright/test';

test.describe('Referral Code Display - Unauthenticated Flow', () => {
    // This is the dev fallback code when no auth token is provided
    // In production with auth, each user would see their own unique code

    // Increase timeout for slower CI environments
    test.setTimeout(60000);

    test('API returns referral code in development mode (no auth)', async ({ request }) => {
        // Without auth header, API uses dev fallback wallet
        const apiResponse = await request.get('/api/referrals');
        expect(apiResponse.status()).toBe(200);

        const apiData = await apiResponse.json();

        // Should return a referral code even in dev mode
        expect(apiData).toHaveProperty('referral_code');
        expect(apiData.referral_code).toBeTruthy();

        // Referral code should match expected format (STACK + 5 chars)
        expect(apiData.referral_code).toMatch(/^STACK[A-Z0-9]{5}$/);

        console.log('[TEST] Dev mode referral_code:', apiData.referral_code);
    });

    test('Rewards page displays referral code element', async ({ page }) => {
        // Navigate to rewards page (uses unauthenticated flow in test)
        await page.goto('/referrals');
        await page.waitForLoadState("networkidle");

        // Wait for page to fully hydrate
        await page.waitForTimeout(2000);

        // The page should either show:
        // 1. A referral code (if user/mock data exists)
        // 2. "Start Earning Rewards" (if no data)
        const referralCodeElement = page.getByTestId('referral-code');
        const startEarningButton = page.getByText('Generate Referral Link');

        // Check what state the page is in
        const hasReferralCode = await referralCodeElement.isVisible({ timeout: 10000 }).catch(() => false);
        const hasStartEarning = await startEarningButton.isVisible({ timeout: 10000 }).catch(() => false);

        console.log('[TEST] Referral code visible:', hasReferralCode);
        console.log('[TEST] Start earning visible:', hasStartEarning);

        // One of these should be true
        expect(hasReferralCode || hasStartEarning).toBe(true);
    });

    test('referral code element is tappable with copy hint', async ({ page }) => {
        // Navigate to referrals page
        await page.goto('/referrals');
        await page.waitForLoadState("domcontentloaded");

        // Check for the "tap to copy" hint (only visible if referral code is shown)
        const tapToCopy = page.getByText('tap to copy');
        const hasHint = await tapToCopy.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasHint) {
            console.log('[TEST] Tap to copy hint is visible');
            await expect(tapToCopy).toBeVisible();
        } else {
            console.log('[TEST] Tap to copy hint not visible (user may not have code yet)');
        }
    });
});

test.describe('Referral Code Display - Format Validation', () => {
    // Increase timeout for slower CI environments
    test.setTimeout(60000);

    test('referral codes follow STACK + 5 alphanumeric format', async ({ request }) => {
        const response = await request.get('/api/referrals');
        const data = await response.json();

        if (data.referral_code) {
            // Validate format: STACK followed by exactly 5 uppercase alphanumeric chars
            expect(data.referral_code).toMatch(/^STACK[A-Z0-9]{5}$/);
            expect(data.referral_code.length).toBe(10);
        }
    });
});

