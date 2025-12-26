/**
 * Unit tests for lib/web3/compound.ts
 * Tests encode functions (pure) and mocked contract interactions
 */
import { describe, it, expect, vi } from "vitest";
import {
    userCollateral,
    supply,
    withdraw,
    borrowBalanceOf,
    getAssetInfo,
    getUtilization,
    getBorrowRate,
    encodeSupplyData,
    encodeWithdrawData,
    encodeApproveData,
    COMPOUND_ADDRESS,
} from "@/lib/web3/compound";
import type { Address, Hex } from "viem";

// Test addresses  
const USER = "0x1234567890abcdef1234567890abcdef12345678" as Address;
const TOKEN = "0xabcdef1234567890abcdef1234567890abcdef12" as Address;
const SPENDER = "0x9876543210fedcba9876543210fedcba98765432" as Address;

describe("COMPOUND_ADDRESS", () => {
    it("should export compound address", () => {
        expect(COMPOUND_ADDRESS).toMatch(/^0x/);
    });
});

describe("encodeSupplyData", () => {
    it("should encode supply function data", () => {
        const data = encodeSupplyData(TOKEN, BigInt(1000000));

        expect(data).toMatch(/^0x/);
        // Length should be valid encoded data
        expect(data.length).toBeGreaterThan(10);
    });

    it("should encode with different amounts", () => {
        const data1 = encodeSupplyData(TOKEN, BigInt(1));
        const data2 = encodeSupplyData(TOKEN, BigInt(999999999999));

        expect(data1).not.toBe(data2);
    });
});

describe("encodeWithdrawData", () => {
    it("should encode withdraw function data", () => {
        const data = encodeWithdrawData(TOKEN, BigInt(500000));

        expect(data).toMatch(/^0x/);
        expect(data.length).toBeGreaterThan(10);
    });
});

describe("encodeApproveData", () => {
    it("should encode approve function data for ERC20", () => {
        const data = encodeApproveData(SPENDER, BigInt(1000000));

        expect(data).toMatch(/^0x/);
        // Should contain approve function selector (0x095ea7b3)
        expect(data.toLowerCase()).toContain("095ea7b3");
    });
});

describe("userCollateral", () => {
    it("should call readContract and return balance from tuple", async () => {
        const mockBalance = BigInt(5000000);
        const mockReadContract = vi.fn().mockResolvedValue([mockBalance, BigInt(0)]);
        const mockPublicClient = { readContract: mockReadContract } as any;

        const result = await userCollateral(mockPublicClient, USER, TOKEN);

        expect(mockReadContract).toHaveBeenCalledWith({
            address: COMPOUND_ADDRESS,
            abi: expect.any(Array),
            functionName: "userCollateral",
            args: [USER, TOKEN],
        });
        expect(result).toBe(mockBalance);
    });
});

describe("supply", () => {
    it("should call writeContract with correct parameters", async () => {
        const mockTxHash = "0xmocktxhash123" as Hex;
        const mockWriteContract = vi.fn().mockResolvedValue(mockTxHash);
        const mockWalletClient = { writeContract: mockWriteContract } as any;

        const result = await supply(mockWalletClient, USER, TOKEN, BigInt(1000000));

        expect(mockWriteContract).toHaveBeenCalledWith({
            address: COMPOUND_ADDRESS,
            abi: expect.any(Array),
            functionName: "supply",
            args: [TOKEN, BigInt(1000000)],
            account: USER,
            chain: expect.objectContaining({ id: 42161 }),
        });
        expect(result).toBe(mockTxHash);
    });
});

describe("withdraw", () => {
    it("should call writeContract with correct parameters", async () => {
        const mockTxHash = "0xmocktxhash456" as Hex;
        const mockWriteContract = vi.fn().mockResolvedValue(mockTxHash);
        const mockWalletClient = { writeContract: mockWriteContract } as any;

        const result = await withdraw(mockWalletClient, USER, TOKEN, BigInt(500000));

        expect(mockWriteContract).toHaveBeenCalledWith({
            address: COMPOUND_ADDRESS,
            abi: expect.any(Array),
            functionName: "withdraw",
            args: [TOKEN, BigInt(500000)],
            account: USER,
            chain: expect.objectContaining({ id: 42161 }),
        });
        expect(result).toBe(mockTxHash);
    });
});

describe("borrowBalanceOf", () => {
    it("should call readContract and return borrow balance", async () => {
        const mockBalance = BigInt(1000000);
        const mockReadContract = vi.fn().mockResolvedValue(mockBalance);
        const mockPublicClient = { readContract: mockReadContract } as any;

        const result = await borrowBalanceOf(mockPublicClient, USER);

        expect(mockReadContract).toHaveBeenCalledWith({
            address: COMPOUND_ADDRESS,
            abi: expect.any(Array),
            functionName: "borrowBalanceOf",
            args: [USER],
        });
        expect(result).toBe(mockBalance);
    });
});

describe("getAssetInfo", () => {
    it("should return borrowCollateralFactor and liquidateCollateralFactor", async () => {
        const mockResult = [
            0,                    // offset
            TOKEN,               // asset
            TOKEN,               // priceFeed
            BigInt(100000000),   // scale
            BigInt(700000000000000000n), // borrowCollateralFactor (70%)
            BigInt(750000000000000000n), // liquidateCollateralFactor (75%)
            BigInt(0),           // liquidationFactor
            BigInt(0),           // supplyCap
        ] as const;

        const mockReadContract = vi.fn().mockResolvedValue(mockResult);
        const mockPublicClient = { readContract: mockReadContract } as any;

        const result = await getAssetInfo(mockPublicClient, TOKEN);

        expect(result).toEqual({
            borrowCollateralFactor: BigInt(700000000000000000n),
            liquidateCollateralFactor: BigInt(750000000000000000n),
        });
    });
});

describe("getUtilization", () => {
    it("should call readContract and return utilization", async () => {
        const mockUtilization = BigInt(500000000000000000n); // 50%
        const mockReadContract = vi.fn().mockResolvedValue(mockUtilization);
        const mockPublicClient = { readContract: mockReadContract } as any;

        const result = await getUtilization(mockPublicClient);

        expect(mockReadContract).toHaveBeenCalledWith({
            address: COMPOUND_ADDRESS,
            abi: expect.any(Array),
            functionName: "getUtilization",
        });
        expect(result).toBe(mockUtilization);
    });
});

describe("getBorrowRate", () => {
    it("should call readContract with utilization and return rate", async () => {
        const mockUtilization = BigInt(500000000000000000n);
        const mockRate = BigInt(35000000); // ~3.5% APR
        const mockReadContract = vi.fn().mockResolvedValue(mockRate);
        const mockPublicClient = { readContract: mockReadContract } as any;

        const result = await getBorrowRate(mockPublicClient, mockUtilization);

        expect(mockReadContract).toHaveBeenCalledWith({
            address: COMPOUND_ADDRESS,
            abi: expect.any(Array),
            functionName: "getBorrowRate",
            args: [mockUtilization],
        });
        expect(result).toBe(mockRate);
    });
});
