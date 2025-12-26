/**
 * E2E Test Fixtures - Mock wallet states for Playwright tests
 * These inject mock auth/wallet data into the browser before tests run
 */

// Test wallet addresses (real addresses for realistic testing)
export const TEST_WALLETS = {
    externalWithLoan: {
        address: "0xfCDd6Dcc5cD3cb62ACEb87687C953CAd1002024A",
        walletClientType: "metamask",
        hasLoan: true,
    },
    embeddedNoLoan: {
        address: "0x45acE1fFdbd4582D4845f155a3898D8780Ebf671",
        walletClientType: "privy",
        hasLoan: false,
    },
    embeddedWithLoan: {
        address: "0x5388B8843030A210765Ee176B2c51F73Be4BdA32",
        walletClientType: "privy",
        hasLoan: true,
    },
} as const;

export type TestWalletKey = keyof typeof TEST_WALLETS;

/**
 * Script to inject into browser to mock Privy auth state
 */
export function createMockAuthScript(walletKey: TestWalletKey): string {
    const wallet = TEST_WALLETS[walletKey];

    return `
    // Mock Privy auth state
    window.__PRIVY_TEST_MODE__ = true;
    window.__PRIVY_MOCK_USER__ = {
      id: "test-user-${walletKey}",
      createdAt: new Date().toISOString(),
      linkedAccounts: [{
        type: "wallet",
        address: "${wallet.address}",
        chainType: "ethereum",
        walletClientType: "${wallet.walletClientType}",
        connectorType: "${wallet.walletClientType === 'privy' ? 'embedded' : 'injected'}",
      }],
    };
    window.__PRIVY_MOCK_WALLET__ = {
      address: "${wallet.address}",
      walletClientType: "${wallet.walletClientType}",
      chainId: 42161, // Arbitrum One
    };
    window.__PRIVY_MOCK_AUTHENTICATED__ = true;
    
    console.log("[E2E] Mock auth injected for wallet: ${walletKey}");
  `;
}

/**
 * Script to clear mock auth (for testing logged-out states)
 */
export const clearMockAuthScript = `
  window.__PRIVY_TEST_MODE__ = true;
  window.__PRIVY_MOCK_USER__ = null;
  window.__PRIVY_MOCK_WALLET__ = null;
  window.__PRIVY_MOCK_AUTHENTICATED__ = false;
  console.log("[E2E] Mock auth cleared");
`;
