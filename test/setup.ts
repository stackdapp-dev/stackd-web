/**
 * Test setup file - runs before all tests
 * Fetches live prices from CoinGecko and prepares wallet fixtures
 */
import { beforeAll, vi } from "vitest";
import "@testing-library/jest-dom";
import { webcrypto } from "node:crypto";

// Polyfill crypto for Node.js test environment (needed for crypto.randomUUID)
if (typeof globalThis.crypto === "undefined") {
    globalThis.crypto = webcrypto as Crypto;
}

// CoinGecko free API for live prices
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";

// Real wallet addresses for testing
export const TEST_WALLETS = {
    externalWithLoan: {
        address: "0xfCDd6Dcc5cD3cb62ACEb87687C953CAd1002024A" as `0x${string}`,
        walletClientType: "metamask" as const,
        hasLoan: true,
    },
    embeddedNoLoan: {
        address: "0x45acE1fFdbd4582D4845f155a3898D8780Ebf671" as `0x${string}`,
        walletClientType: "privy" as const,
        hasLoan: false,
    },
    embeddedWithLoan: {
        address: "0x5388B8843030A210765Ee176B2c51F73Be4BdA32" as `0x${string}`,
        walletClientType: "privy" as const,
        hasLoan: true,
    },
} as const;

export type TestWalletKey = keyof typeof TEST_WALLETS;

// Live prices - fetched once before all tests
export let realPrices: Record<string, { usd: number }> = {
    WBTC: { usd: 95000 },
    ETH: { usd: 3500 },
    USDT: { usd: 1 },
};

// Wallet fixture data - populated during setup
export interface WalletFixtureData {
    address: `0x${string}`;
    walletClientType: "privy" | "metamask";
    hasLoan: boolean;
    transactions?: any[];
}

export const walletFixtures: Record<TestWalletKey, WalletFixtureData> = {
    externalWithLoan: { ...TEST_WALLETS.externalWithLoan },
    embeddedNoLoan: { ...TEST_WALLETS.embeddedNoLoan },
    embeddedWithLoan: { ...TEST_WALLETS.embeddedWithLoan },
};

beforeAll(async () => {
    console.log("[TEST SETUP] Fetching live prices from CoinGecko...");

    try {
        const res = await fetch(COINGECKO_URL);
        if (res.ok) {
            const data = await res.json();
            realPrices = {
                WBTC: { usd: data.bitcoin?.usd ?? 95000 },
                ETH: { usd: data.ethereum?.usd ?? 3500 },
                USDT: { usd: 1 }, // Always $1
            };
            console.log("[TEST SETUP] Live prices:", realPrices);
        }
    } catch (error) {
        console.warn("[TEST SETUP] CoinGecko fetch failed, using fallback prices");
    }

    console.log("[TEST SETUP] Test wallets ready:", Object.keys(TEST_WALLETS));
});

// Mock window.fetch for transaction history if needed
// This can be extended to mock specific API calls
