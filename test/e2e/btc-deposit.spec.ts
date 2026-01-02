import { test, expect } from '@playwright/test';
import { mockBtcDepositApi, mockBtcStatusApi, mockBtcQuoteApi } from './fixtures/btc-mocks';

test.describe('BTC Deposit Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockBtcDepositApi(page);
    await mockBtcStatusApi(page);
    await mockBtcQuoteApi(page);
  });

  test('should complete deposit flow', async ({ page }) => {
    await page.goto('/btc/deposit');

    // Enter amount
    await page.fill('[data-testid="btc-amount-input"]', '0.5');

    // Click get quote
    await page.click('[data-testid="get-quote-btn"]');

    // Wait for quote to load
    await expect(page.locator('[data-testid="quote-output"]')).toBeVisible();
    await expect(page.locator('[data-testid="quote-output"]')).toContainText('0.495');

    // Verify deposit address displayed
    await expect(page.locator('[data-testid="deposit-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="deposit-address"]')).toContainText('bc1q');

    // Verify QR code
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
  });

  test('should show error for amount below minimum', async ({ page }) => {
    await page.goto('/btc/deposit');

    await page.fill('[data-testid="btc-amount-input"]', '0.00001');
    await page.click('[data-testid="get-quote-btn"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(/minimum/i);
  });

  test('should copy deposit address to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/btc/deposit');
    await page.fill('[data-testid="btc-amount-input"]', '0.5');
    await page.click('[data-testid="get-quote-btn"]');

    await expect(page.locator('[data-testid="deposit-address"]')).toBeVisible();

    await page.click('[data-testid="copy-address-btn"]');

    // Verify toast or confirmation
    await expect(page.locator('text=Copied')).toBeVisible();
  });

  test('should show expiration countdown', async ({ page }) => {
    await page.goto('/btc/deposit');
    await page.fill('[data-testid="btc-amount-input"]', '0.5');
    await page.click('[data-testid="get-quote-btn"]');

    await expect(page.locator('[data-testid="expiration-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiration-timer"]')).toContainText(/\d+:\d+/);
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/btc/deposit');
    await page.fill('[data-testid="btc-amount-input"]', '0.5');
    await page.click('[data-testid="get-quote-btn"]');

    await expect(page.locator('[data-testid="deposit-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
  });
});
