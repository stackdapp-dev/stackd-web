/**
 * TDD tests for Fluid Vault withdraw parameter validation
 *
 * These tests define the expected validation behavior for the encodeFluidWithdraw function.
 * The function should reject invalid parameters to prevent "Missing or invalid parameters" errors.
 */
import { describe, it, expect } from "vitest";

import { encodeFluidWithdraw } from "@/lib/web3/fluid";

describe("encodeFluidWithdraw parameter validation", () => {
  const validNftId = BigInt(12345);
  const validAmount = BigInt("1000000"); // 1 XAUT (6 decimals)
  const validRecipient = "0x1234567890123456789012345678901234567890" as const;
  const zeroAddress = "0x0000000000000000000000000000000000000000" as const;

  describe("nftId validation", () => {
    it("should throw when nftId is 0n", () => {
      expect(() => encodeFluidWithdraw(0n, validAmount, validRecipient)).toThrow(
        "nftId must be greater than 0"
      );
    });

    it("should throw when nftId is negative", () => {
      expect(() => encodeFluidWithdraw(-1n, validAmount, validRecipient)).toThrow(
        "nftId must be greater than 0"
      );
    });
  });

  describe("amount validation", () => {
    it("should throw when amount is 0n", () => {
      expect(() => encodeFluidWithdraw(validNftId, 0n, validRecipient)).toThrow(
        "amount must be greater than 0"
      );
    });

    it("should throw when amount is negative", () => {
      expect(() => encodeFluidWithdraw(validNftId, -1n, validRecipient)).toThrow(
        "amount must be greater than 0"
      );
    });
  });

  describe("recipient validation", () => {
    it("should throw when recipient is zero address", () => {
      expect(() => encodeFluidWithdraw(validNftId, validAmount, zeroAddress)).toThrow(
        "recipient cannot be zero address"
      );
    });
  });

  describe("valid parameters", () => {
    it("should succeed with valid parameters", () => {
      const result = encodeFluidWithdraw(validNftId, validAmount, validRecipient);

      expect(result).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it("should succeed with large valid nftId", () => {
      const largeNftId = BigInt("999999999999");
      const result = encodeFluidWithdraw(largeNftId, validAmount, validRecipient);

      expect(result).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it("should succeed with large valid amount", () => {
      const largeAmount = BigInt("999999999999999999");
      const result = encodeFluidWithdraw(validNftId, largeAmount, validRecipient);

      expect(result).toMatch(/^0x[a-fA-F0-9]+$/);
    });
  });
});
