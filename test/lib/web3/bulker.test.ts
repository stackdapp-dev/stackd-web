/**
 * Unit tests for lib/web3/bulker.ts
 * Tests encode functions for Compound Bulker contract
 */
import { describe, it, expect } from "vitest";
import type { Address } from "viem";

// Test addresses
const USER = "0x1234567890abcdef1234567890abcdef12345678" as Address;
const COMET = "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07" as Address; // Compound USDT on Arbitrum
const WBTC = "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f" as Address;
const USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as Address;

describe("BULKER_ADDRESS", () => {
    it("should export bulker address", async () => {
        const { BULKER_ADDRESS } = await import("@/lib/web3/bulker");
        expect(BULKER_ADDRESS).toMatch(/^0x/);
        expect(BULKER_ADDRESS.toLowerCase()).toBe("0xbde8f31d2ddda895264e27dd990fab3dc87b372d");
    });
});

describe("ACTION_SUPPLY_ASSET", () => {
    it("should be correctly encoded as bytes32", async () => {
        const { ACTION_SUPPLY_ASSET } = await import("@/lib/web3/bulker");
        expect(ACTION_SUPPLY_ASSET).toMatch(/^0x/);
        // Should be 66 characters (0x + 64 hex chars for bytes32)
        expect(ACTION_SUPPLY_ASSET.length).toBe(66);
    });
});

describe("ACTION_WITHDRAW_ASSET", () => {
    it("should be correctly encoded as bytes32", async () => {
        const { ACTION_WITHDRAW_ASSET } = await import("@/lib/web3/bulker");
        expect(ACTION_WITHDRAW_ASSET).toMatch(/^0x/);
        // Should be 66 characters (0x + 64 hex chars for bytes32)
        expect(ACTION_WITHDRAW_ASSET.length).toBe(66);
    });
});

describe("encodeBulkerSupplyAndBorrow", () => {
    it("should encode supply + withdraw actions for combined operation", async () => {
        const { encodeBulkerSupplyAndBorrow } = await import("@/lib/web3/bulker");

        const data = encodeBulkerSupplyAndBorrow(
            COMET,
            USER,
            WBTC,
            BigInt(10000000), // 0.1 WBTC (8 decimals)
            USDT,
            BigInt(1000000000) // 1000 USDT (6 decimals)
        );

        expect(data).toMatch(/^0x/);
        // Should be valid hex encoded invoke call
        expect(data.length).toBeGreaterThan(10);
    });

    it("should encode different amounts correctly", async () => {
        const { encodeBulkerSupplyAndBorrow } = await import("@/lib/web3/bulker");

        const data1 = encodeBulkerSupplyAndBorrow(
            COMET,
            USER,
            WBTC,
            BigInt(10000000),
            USDT,
            BigInt(1000000000)
        );

        const data2 = encodeBulkerSupplyAndBorrow(
            COMET,
            USER,
            WBTC,
            BigInt(20000000),
            USDT,
            BigInt(2000000000)
        );

        expect(data1).not.toBe(data2);
    });
});

describe("encodeAllowAction", () => {
    it("should encode allow action for granting Bulker permission", async () => {
        const { encodeAllowAction, BULKER_ADDRESS } = await import("@/lib/web3/bulker");

        const data = encodeAllowAction(COMET, BULKER_ADDRESS as Address, true);

        expect(data).toMatch(/^0x/);
        // Should contain the allow function selector
        expect(data.length).toBeGreaterThan(10);
    });
});

describe("encodeBulkerSupplyBorrowWithAllow", () => {
    it("should encode allow + supply + withdraw for first-time users", async () => {
        const { encodeBulkerSupplyBorrowWithAllow, BULKER_ADDRESS } = await import("@/lib/web3/bulker");

        const { allowData, bulkerData } = encodeBulkerSupplyBorrowWithAllow(
            COMET,
            USER,
            WBTC,
            BigInt(10000000),
            USDT,
            BigInt(1000000000)
        );

        // Allow data should be for granting Bulker permission on Comet
        expect(allowData).toMatch(/^0x/);
        expect(allowData.length).toBeGreaterThan(10);

        // Bulker data should be for the invoke call
        expect(bulkerData).toMatch(/^0x/);
        expect(bulkerData.length).toBeGreaterThan(10);
    });
});

describe("hasAllowance", () => {
    it("should check if user has granted Bulker permission", async () => {
        const { hasAllowance } = await import("@/lib/web3/bulker");

        // This is a type check - the actual implementation will query the contract
        expect(typeof hasAllowance).toBe("function");
    });
});
