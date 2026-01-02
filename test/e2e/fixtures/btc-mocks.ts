import { Page } from '@playwright/test';

export async function mockBtcDepositApi(page: Page) {
  await page.route('**/api/btc/deposit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        depositId: 'dep-e2e-123',
        depositAddress: 'bc1qe2etest123456789',
        memo: 'SWAP:ARB.WBTC:0xtest',
        expectedAmount: '0.5',
        expectedOutput: '0.495',
        expiresAt: Date.now() + 600000,
        status: 'awaiting_deposit',
      }),
    });
  });
}

export async function mockBtcWithdrawApi(page: Page) {
  await page.route('**/api/btc/withdraw', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        withdrawalId: 'wd-e2e-123',
        inputAmount: '0.5',
        expectedOutput: '0.495',
        btcAddress: 'bc1qtest',
        approvalRequired: true,
        approvalTx: { to: '0xtest', data: '0x' },
        status: 'pending_approval',
      }),
    });
  });
}

export async function mockBtcStatusApi(page: Page, status: string = 'awaiting_deposit') {
  await page.route('**/api/btc/status/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status,
        timeline: [
          { stage: 'initiated', timestamp: Date.now() - 60000 },
        ],
      }),
    });
  });
}

export async function mockBtcQuoteApi(page: Page) {
  await page.route('**/api/btc/quote**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        expectedOutput: '0.495',
        fees: {
          network: '0.0001',
          affiliate: '0.0015',
        },
        estimatedTime: 600,
      }),
    });
  });
}
