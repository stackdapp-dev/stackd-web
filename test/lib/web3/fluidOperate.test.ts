/**
 * TDD tests for Fluid Vault operate encoding functions
 *
 * These tests define the expected behavior for encoding Fluid vault operations.
 * The operate function is the core transaction method for all position changes.
 */
import { describe, it, expect } from "vitest";
import { encodeFunctionData } from "viem";

// Import functions we will implement
import {
  encodeFluidOperateData,
  encodeFluidSupply,
  encodeFluidWithdraw,
  encodeFluidBorrow,
  encodeFluidRepay,
  FLUID_VAULT_ABI,
} from "@/lib/web3/fluid";

describe("Fluid operate encoding functions", () => {
  const mockNftId = BigInt(12345);
  const mockAmount = BigInt("1000000"); // 1 XAUT/USDT (6 decimals)
  const mockRecipient = "0x1234567890123456789012345678901234567890" as const;

  describe("FLUID_VAULT_ABI", () => {
    it("should export the operate function ABI", () => {
      expect(FLUID_VAULT_ABI).toBeDefined();
      expect(Array.isArray(FLUID_VAULT_ABI)).toBe(true);

      const operateFunction = FLUID_VAULT_ABI.find(
        (item: { name?: string }) => item.name === "operate"
      );
      expect(operateFunction).toBeDefined();
    });

    it("should have correct operate function signature", () => {
      const operateFunction = FLUID_VAULT_ABI.find(
        (item: { name?: string }) => item.name === "operate"
      );

      expect(operateFunction).toMatchObject({
        name: "operate",
        type: "function",
        stateMutability: "payable",
      });

      // Check inputs: nftId_, newCol_, newDebt_, to_
      expect(operateFunction?.inputs).toHaveLength(4);
      expect(operateFunction?.inputs?.[0]).toMatchObject({ name: "nftId_", type: "uint256" });
      expect(operateFunction?.inputs?.[1]).toMatchObject({ name: "newCol_", type: "int256" });
      expect(operateFunction?.inputs?.[2]).toMatchObject({ name: "newDebt_", type: "int256" });
      expect(operateFunction?.inputs?.[3]).toMatchObject({ name: "to_", type: "address" });
    });
  });

  describe("encodeFluidOperateData", () => {
    it("should encode a valid hex string starting with 0x", () => {
      const encoded = encodeFluidOperateData(
        mockNftId,
        mockAmount,
        BigInt(0),
        mockRecipient
      );

      expect(encoded).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it("should encode add collateral correctly (positive collateral, zero debt)", () => {
      const encoded = encodeFluidOperateData(
        mockNftId,
        mockAmount,
        BigInt(0),
        mockRecipient
      );

      // Verify it matches what viem would produce
      const expected = encodeFunctionData({
        abi: FLUID_VAULT_ABI,
        functionName: "operate",
        args: [mockNftId, mockAmount, BigInt(0), mockRecipient],
      });

      expect(encoded).toBe(expected);
    });

    it("should encode withdraw collateral correctly (negative collateral, zero debt)", () => {
      const negativeAmount = -mockAmount;
      const encoded = encodeFluidOperateData(
        mockNftId,
        negativeAmount,
        BigInt(0),
        mockRecipient
      );

      const expected = encodeFunctionData({
        abi: FLUID_VAULT_ABI,
        functionName: "operate",
        args: [mockNftId, negativeAmount, BigInt(0), mockRecipient],
      });

      expect(encoded).toBe(expected);
    });

    it("should encode borrow correctly (zero collateral, positive debt)", () => {
      const encoded = encodeFluidOperateData(
        mockNftId,
        BigInt(0),
        mockAmount,
        mockRecipient
      );

      const expected = encodeFunctionData({
        abi: FLUID_VAULT_ABI,
        functionName: "operate",
        args: [mockNftId, BigInt(0), mockAmount, mockRecipient],
      });

      expect(encoded).toBe(expected);
    });

    it("should encode repay correctly (zero collateral, negative debt)", () => {
      const negativeAmount = -mockAmount;
      const encoded = encodeFluidOperateData(
        mockNftId,
        BigInt(0),
        negativeAmount,
        mockRecipient
      );

      const expected = encodeFunctionData({
        abi: FLUID_VAULT_ABI,
        functionName: "operate",
        args: [mockNftId, BigInt(0), negativeAmount, mockRecipient],
      });

      expect(encoded).toBe(expected);
    });

    it("should handle combined operations (add collateral and borrow)", () => {
      const collateralAmount = BigInt("5000000"); // 5 XAUT
      const borrowAmount = BigInt("10000000000"); // 10000 USDT

      const encoded = encodeFluidOperateData(
        mockNftId,
        collateralAmount,
        borrowAmount,
        mockRecipient
      );

      const expected = encodeFunctionData({
        abi: FLUID_VAULT_ABI,
        functionName: "operate",
        args: [mockNftId, collateralAmount, borrowAmount, mockRecipient],
      });

      expect(encoded).toBe(expected);
    });

    it("should handle nftId of 0 for new position creation", () => {
      const encoded = encodeFluidOperateData(
        BigInt(0),
        mockAmount,
        BigInt(0),
        mockRecipient
      );

      expect(encoded).toMatch(/^0x/);
    });
  });

  describe("convenience wrapper functions", () => {
    describe("encodeFluidSupply", () => {
      it("should encode positive collateral delta with zero debt", () => {
        const encoded = encodeFluidSupply(mockNftId, mockAmount, mockRecipient);
        const direct = encodeFluidOperateData(
          mockNftId,
          mockAmount,
          BigInt(0),
          mockRecipient
        );

        expect(encoded).toBe(direct);
      });

      it("should always produce positive collateral value", () => {
        // Even if someone passes a negative, it should use positive
        const encoded = encodeFluidSupply(mockNftId, mockAmount, mockRecipient);

        // Verify the encoded data represents adding collateral
        const expected = encodeFunctionData({
          abi: FLUID_VAULT_ABI,
          functionName: "operate",
          args: [mockNftId, mockAmount, BigInt(0), mockRecipient],
        });

        expect(encoded).toBe(expected);
      });
    });

    describe("encodeFluidWithdraw", () => {
      it("should encode negative collateral delta with zero debt", () => {
        const encoded = encodeFluidWithdraw(mockNftId, mockAmount, mockRecipient);
        const direct = encodeFluidOperateData(
          mockNftId,
          -mockAmount,
          BigInt(0),
          mockRecipient
        );

        expect(encoded).toBe(direct);
      });
    });

    describe("encodeFluidBorrow", () => {
      it("should encode positive debt delta with zero collateral", () => {
        const encoded = encodeFluidBorrow(mockNftId, mockAmount, mockRecipient);
        const direct = encodeFluidOperateData(
          mockNftId,
          BigInt(0),
          mockAmount,
          mockRecipient
        );

        expect(encoded).toBe(direct);
      });
    });

    describe("encodeFluidRepay", () => {
      it("should encode negative debt delta with zero collateral", () => {
        const encoded = encodeFluidRepay(mockNftId, mockAmount, mockRecipient);
        const direct = encodeFluidOperateData(
          mockNftId,
          BigInt(0),
          -mockAmount,
          mockRecipient
        );

        expect(encoded).toBe(direct);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle very large amounts", () => {
      const largeAmount = BigInt("999999999999999999999999999");

      const encoded = encodeFluidOperateData(
        mockNftId,
        largeAmount,
        BigInt(0),
        mockRecipient
      );

      expect(encoded).toMatch(/^0x/);
    });

    it("should handle max int256 positive value", () => {
      const maxInt256 = BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819967");

      const encoded = encodeFluidOperateData(
        mockNftId,
        maxInt256,
        BigInt(0),
        mockRecipient
      );

      expect(encoded).toMatch(/^0x/);
    });

    it("should handle large negative value for withdrawals", () => {
      const largeNegative = BigInt("-999999999999999999");

      const encoded = encodeFluidOperateData(
        mockNftId,
        largeNegative,
        BigInt(0),
        mockRecipient
      );

      expect(encoded).toMatch(/^0x/);
    });
  });
});
