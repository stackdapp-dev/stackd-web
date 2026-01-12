import { test, expect } from '@playwright/test';
import { mockBtcWithdrawApi, mockBtcStatusApi, mockBtcQuoteApi } from './fixtures/btc-mocks';

test.describe('BTC Withdrawal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockBtcWithdrawApi(page);
    await mockBtcStatusApi(page, 'pending_approval');
    await mockBtcQuoteApi(page);
  });

  test('should complete withdrawal flow', async ({ page }) => {
    await page.goto('/btc/withdraw');

    // Enter WBTC amount
    await page.fill('[data-testid="wbtc-amount-input"]', '0.5');

    // Enter BTC address
    await page.fill('[data-testid="btc-address-input"]', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');

    // Click get quote
    await page.click('[data-testid="get-quote-btn"]');

    // Wait for quote
    await expect(page.locator('[data-testid="quote-output"]')).toBeVisible();
    await expect(page.locator('[data-testid="quote-output"]')).toContainText('0.495');
  });

  test('should validate BTC address', async ({ page }) => {
    await page.goto('/btc/withdraw');

    await page.fill('[data-testid="btc-address-input"]', 'invalid-address');
    await page.press('[data-testid="btc-address-input"]', 'Tab');

    await expect(page.locator('[data-testid="address-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-error"]')).toContainText(/invalid/i);
  });

  test('should accept valid bech32 address', async ({ page }) => {
    await page.goto('/btc/withdraw');

    await page.fill('[data-testid="btc-address-input"]', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await page.press('[data-testid="btc-address-input"]', 'Tab');

    await expect(page.locator('[data-testid="address-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="address-valid"]')).toBeVisible();
  });

  test('should show approval button when needed', async ({ page }) => {
    await page.goto('/btc/withdraw');

    await page.fill('[data-testid="wbtc-amount-input"]', '0.5');
    await page.fill('[data-testid="btc-address-input"]', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await page.click('[data-testid="get-quote-btn"]');

    await expect(page.locator('[data-testid="approve-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="approve-btn"]')).toContainText(/Approve/i);
  });

  test('should show fee breakdown', async ({ page }) => {
    await page.goto('/btc/withdraw');

    await page.fill('[data-testid="wbtc-amount-input"]', '0.5');
    await page.fill('[data-testid="btc-address-input"]', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await page.click('[data-testid="get-quote-btn"]');

    await expect(page.locator('[data-testid="fee-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="fee-breakdown"]')).toContainText(/Network Fee/i);
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/btc/withdraw');
    await page.fill('[data-testid="wbtc-amount-input"]', '0.5');
    await page.fill('[data-testid="btc-address-input"]', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await page.click('[data-testid="get-quote-btn"]');

    await expect(page.locator('[data-testid="quote-output"]')).toBeVisible();
  });

  test('should reject testnet address', async ({ page }) => {
    await page.goto('/btc/withdraw');

    await page.fill('[data-testid="btc-address-input"]', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
    await page.press('[data-testid="btc-address-input"]', 'Tab');

    await expect(page.locator('[data-testid="address-error"]')).toContainText(/testnet/i);
  });
});
