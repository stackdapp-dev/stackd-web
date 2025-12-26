/**
 * Test mode utilities for E2E testing
 * When window.__PRIVY_TEST_MODE__ is true, the app uses mock auth data
 * injected via Playwright's page.addInitScript()
 */

// Global type declarations for test mode
declare global {
    interface Window {
        __PRIVY_TEST_MODE__?: boolean;
        __PRIVY_MOCK_AUTHENTICATED__?: boolean;
        __PRIVY_MOCK_USER__?: {
            id: string;
            createdAt: string;
            linkedAccounts: Array<{
                type: string;
                address: string;
                chainType: string;
                walletClientType: string;
                connectorType: string;
            }>;
        };
        __PRIVY_MOCK_WALLET__?: {
            address: string;
            walletClientType: string;
            chainId: number;
        };
    }
}

/**
 * Check if we're in test mode
 */
export function isTestMode(): boolean {
    if (typeof window === "undefined") return false;
    return window.__PRIVY_TEST_MODE__ === true;
}

/**
 * Get mock authenticated state for test mode
 */
export function getTestAuthenticated(): boolean {
    if (!isTestMode()) return false;
    return window.__PRIVY_MOCK_AUTHENTICATED__ === true;
}

/**
 * Get mock user for test mode
 */
export function getTestUser() {
    if (!isTestMode()) return null;
    return window.__PRIVY_MOCK_USER__ ?? null;
}

/**
 * Get mock wallet for test mode
 */
export function getTestWallet() {
    if (!isTestMode()) return null;
    return window.__PRIVY_MOCK_WALLET__ ?? null;
}

/**
 * Create a mock ConnectedWallet object for test mode
 */
export function createMockConnectedWallet() {
    const mockWallet = getTestWallet();
    if (!mockWallet) return null;

    return {
        address: mockWallet.address as `0x${string}`,
        walletClientType: mockWallet.walletClientType,
        chainId: mockWallet.chainId,
        // Mock methods
        getEthereumProvider: async () => ({
            request: async ({ method }: { method: string }) => {
                console.log("[TEST MODE] Mock provider request:", method);
                if (method === "eth_chainId") return "0xa4b1"; // Arbitrum
                if (method === "eth_accounts") return [mockWallet.address];
                return null;
            },
        }),
    };
}
