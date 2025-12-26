/**
 * Mock wallet providers for unit tests
 */
import { vi } from "vitest";
import { TEST_WALLETS, type TestWalletKey } from "../setup";

// Mock sendSponsoredTransaction
export const mockSendTransaction = vi.fn().mockResolvedValue({
    hash: "0xmocktxhash123456789abcdef",
    error: null,
});

// Mock Web3 context value generator
export function createMockWeb3Context(walletKey: TestWalletKey) {
    const wallet = TEST_WALLETS[walletKey];

    return {
        publicClient: {
            readContract: vi.fn(),
            getBalance: vi.fn(),
        },
        walletClient: {
            account: { address: wallet.address },
            writeContract: vi.fn(),
        },
        wallets: [wallet],
        activeWalletAddress: wallet.address,
        setActiveWalletAddress: vi.fn(),
        ensureCorrectNetwork: vi.fn().mockResolvedValue(undefined),
        clearWalletState: vi.fn(),
        sendSponsoredTransaction: mockSendTransaction,
        isSendingTransaction: false,
        isExternalWallet: wallet.walletClientType !== "privy",
    };
}

// Mock TokenPriceProvider context
export function createMockTokenPrices() {
    return {
        WBTC: { usd: 95000 },
        ETH: { usd: 3500 },
        USDT: { usd: 1 },
    };
}
