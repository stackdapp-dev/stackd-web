/**
 * Unit tests for lib/web3/erc20.ts
 * Tests encode functions (pure) and mocked contract interactions
 */
import { describe, it, expect, vi } from "vitest";
import {
    allowance,
    approve,
    transfer,
    encodeTransferData,
    encodeApproveData,
} from "@/lib/web3/erc20";
import type { Address, Hex } from "viem";

// Test addresses
const OWNER = "0x1234567890abcdef1234567890abcdef12345678" as Address;
const SPENDER = "0xabcdef1234567890abcdef1234567890abcdef12" as Address;
const RECIPIENT = "0x9876543210fedcba9876543210fedcba98765432" as Address;
const TOKEN = "0xfedcba9876543210fedcba9876543210fedcba98" as Address;

describe("encodeTransferData", () => {
    it("should encode transfer function data", () => {
        const data = encodeTransferData(RECIPIENT, BigInt(1000000));

        // Should return hex string starting with 0x
        expect(data).toMatch(/^0x/);
        // Should contain transfer function selector (0xa9059cbb)
        expect(data.toLowerCase()).toContain("a9059cbb");
    });

    it("should encode with different amounts", () => {
        const data1 = encodeTransferData(RECIPIENT, BigInt(1));
        const data2 = encodeTransferData(RECIPIENT, BigInt(999999999999));

        expect(data1).not.toBe(data2);
        expect(data1).toMatch(/^0x/);
        expect(data2).toMatch(/^0x/);
    });
});

describe("encodeApproveData", () => {
    it("should encode approve function data", () => {
        const data = encodeApproveData(SPENDER, BigInt(1000000));

        // Should return hex string starting with 0x
        expect(data).toMatch(/^0x/);
        // Should contain approve function selector (0x095ea7b3)
        expect(data.toLowerCase()).toContain("095ea7b3");
    });

    it("should encode max uint256 approval", () => {
        const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const data = encodeApproveData(SPENDER, maxUint256);

        expect(data).toMatch(/^0x/);
        // Should contain the max value
        expect(data.toLowerCase()).toContain("ffffffff");
    });
});

describe("allowance", () => {
    it("should call readContract with correct parameters", async () => {
        const mockReadContract = vi.fn().mockResolvedValue(BigInt(5000000));
        const mockPublicClient = {
            readContract: mockReadContract,
        } as any;

        const result = await allowance(mockPublicClient, OWNER, TOKEN, SPENDER);

        expect(mockReadContract).toHaveBeenCalledWith({
            address: TOKEN,
            abi: expect.any(Array),
            functionName: "allowance",
            args: [OWNER, SPENDER],
        });
        expect(result).toBe(BigInt(5000000));
    });
});

describe("approve", () => {
    it("should call writeContract with correct parameters", async () => {
        const mockTxHash = "0xmocktxhash123456789" as Hex;
        const mockWriteContract = vi.fn().mockResolvedValue(mockTxHash);
        const mockWalletClient = {
            writeContract: mockWriteContract,
        } as any;

        const result = await approve(mockWalletClient, OWNER, TOKEN, SPENDER, BigInt(1000000));

        expect(mockWriteContract).toHaveBeenCalledWith({
            address: TOKEN,
            abi: expect.any(Array),
            functionName: "approve",
            args: [SPENDER, BigInt(1000000)],
            account: OWNER,
            chain: expect.objectContaining({ id: 42161 }), // Arbitrum chain ID
        });
        expect(result).toBe(mockTxHash);
    });
});

describe("transfer", () => {
    it("should call writeContract with correct parameters", async () => {
        const mockTxHash = "0xmocktxhash987654321" as Hex;
        const mockWriteContract = vi.fn().mockResolvedValue(mockTxHash);
        const mockWalletClient = {
            writeContract: mockWriteContract,
        } as any;

        const result = await transfer(mockWalletClient, OWNER, RECIPIENT, TOKEN, BigInt(500000));

        expect(mockWriteContract).toHaveBeenCalledWith({
            address: TOKEN,
            abi: expect.any(Array),
            functionName: "transfer",
            args: [RECIPIENT, BigInt(500000)],
            account: OWNER,
            chain: expect.objectContaining({ id: 42161 }),
        });
        expect(result).toBe(mockTxHash);
    });
});
