/**
 * Unit tests for transaction utility functions
 * TDD: Testing the USD value calculation for transaction history
 */
import { describe, it, expect } from "vitest";
import { calculateTransactionUsdValue } from "@/lib/transactionUtils";

describe("calculateTransactionUsdValue", () => {
  describe("with stablecoins (USDT, USD₮0)", () => {
    it("should return the amount for USDT regardless of price", () => {
      // USDT is pegged to $1, so 100 USDT = $100
      const result = calculateTransactionUsdValue(100, "USDT", () => 1);
      expect(result).toBe(100);
    });

    it("should return the amount for USD₮0 (USDT0 variant) regardless of price", () => {
      // USD₮0 is USDT on certain networks, pegged to $1
      const result = calculateTransactionUsdValue(5, "USD₮0", () => 0);
      expect(result).toBe(5);
    });

    it("should handle fractional stablecoin amounts", () => {
      const result = calculateTransactionUsdValue(10.8686, "USDT", () => 1);
      expect(result).toBeCloseTo(10.8686, 4);
    });

    it("should handle fractional USD₮0 amounts", () => {
      const result = calculateTransactionUsdValue(10.8686, "USD₮0", () => 0);
      expect(result).toBeCloseTo(10.8686, 4);
    });
  });

  describe("with WBTC", () => {
    it("should multiply amount by the market price for WBTC", () => {
      // 0.5 WBTC at $100,000/BTC = $50,000
      const getPrice = (symbol: string) => (symbol === "WBTC" ? 100000 : 0);
      const result = calculateTransactionUsdValue(0.5, "WBTC", getPrice);
      expect(result).toBe(50000);
    });

    it("should use the actual price, not a hardcoded value", () => {
      // 1 WBTC at $87,000/BTC = $87,000 (not the hardcoded $95,000)
      const getPrice = (symbol: string) => (symbol === "WBTC" ? 87000 : 0);
      const result = calculateTransactionUsdValue(1, "WBTC", getPrice);
      expect(result).toBe(87000);
    });

    it("should handle small WBTC amounts correctly", () => {
      // 0.00012745 WBTC at $95,000/BTC = ~$12.11
      const getPrice = (symbol: string) => (symbol === "WBTC" ? 95000 : 0);
      const result = calculateTransactionUsdValue(0.00012745, "WBTC", getPrice);
      expect(result).toBeCloseTo(12.10775, 2);
    });
  });

  describe("with ETH", () => {
    it("should multiply amount by the market price for ETH", () => {
      // 10 ETH at $3,000/ETH = $30,000
      const getPrice = (symbol: string) => (symbol === "ETH" ? 3000 : 0);
      const result = calculateTransactionUsdValue(10, "ETH", getPrice);
      expect(result).toBe(30000);
    });

    it("should use the actual price, not a hardcoded value", () => {
      // 1 ETH at $2,500/ETH = $2,500 (not the hardcoded $3,500)
      const getPrice = (symbol: string) => (symbol === "ETH" ? 2500 : 0);
      const result = calculateTransactionUsdValue(1, "ETH", getPrice);
      expect(result).toBe(2500);
    });
  });

  describe("with other tokens", () => {
    it("should calculate USD value for arbitrary tokens using market price", () => {
      // 100 ARB at $1.50 = $150
      const getPrice = (symbol: string) => (symbol === "ARB" ? 1.5 : 0);
      const result = calculateTransactionUsdValue(100, "ARB", getPrice);
      expect(result).toBe(150);
    });

    it("should return 0 if no price is available", () => {
      const getPrice = () => 0;
      const result = calculateTransactionUsdValue(100, "UNKNOWN", getPrice);
      expect(result).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle zero amounts", () => {
      const getPrice = () => 100000;
      const result = calculateTransactionUsdValue(0, "WBTC", getPrice);
      expect(result).toBe(0);
    });

    it("should handle very large amounts", () => {
      // 1000 WBTC at $100,000 = $100,000,000
      const getPrice = (symbol: string) => (symbol === "WBTC" ? 100000 : 0);
      const result = calculateTransactionUsdValue(1000, "WBTC", getPrice);
      expect(result).toBe(100000000);
    });

    it("should handle negative amounts (for sends)", () => {
      const getPrice = (symbol: string) => (symbol === "ETH" ? 3000 : 0);
      const result = calculateTransactionUsdValue(-5, "ETH", getPrice);
      expect(result).toBe(-15000);
    });
  });
});
