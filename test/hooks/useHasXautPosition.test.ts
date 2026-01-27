/**
 * TDD Tests for useHasXautPosition Hook
 *
 * This hook detects whether a user has any XAUT position.
 * A position is detected if:
 * - XAUT exists in Fluid suppliedAssets with amount > 0, OR
 * - xautBalance > 0 (wallet balance)
 *
 * Requirements:
 * - Return { hasXautPosition: boolean, isLoading: boolean }
 * - isLoading reflects underlying hooks' loading states
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the hooks
const mockFluidData = {
  suppliedAssets: [] as Array<{ symbol: string; amount: number; usdValue: number }>,
  isLoading: false,
};

const mockXautBalanceData = {
  xautBalance: 0,
  isLoading: false,
};

vi.mock("@/hooks/useFluid", () => ({
  useFluid: () => mockFluidData,
}));

vi.mock("@/hooks/useXautBalance", () => ({
  useXautBalance: () => mockXautBalanceData,
}));

describe("useHasXautPosition", () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockFluidData.suppliedAssets = [];
    mockFluidData.isLoading = false;
    mockXautBalanceData.xautBalance = 0;
    mockXautBalanceData.isLoading = false;
  });

  describe("No XAUT Position", () => {
    it("should return hasXautPosition=false when no XAUT anywhere", async () => {
      // No XAUT in Fluid, no XAUT in wallet
      mockFluidData.suppliedAssets = [];
      mockXautBalanceData.xautBalance = 0;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(false);
    });

    it("should return hasXautPosition=false when Fluid has zero XAUT amount", async () => {
      // XAUT in Fluid but amount is 0
      mockFluidData.suppliedAssets = [{ symbol: "XAUT", amount: 0, usdValue: 0 }];
      mockXautBalanceData.xautBalance = 0;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(false);
    });

    it("should return hasXautPosition=false when Fluid has other tokens but no XAUT", async () => {
      // Fluid has WBTC but no XAUT
      mockFluidData.suppliedAssets = [{ symbol: "WBTC", amount: 0.5, usdValue: 47500 }];
      mockXautBalanceData.xautBalance = 0;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(false);
    });
  });

  describe("XAUT in Fluid Protocol", () => {
    it("should return hasXautPosition=true when XAUT is in Fluid with amount > 0", async () => {
      // XAUT in Fluid suppliedAssets with positive amount
      mockFluidData.suppliedAssets = [{ symbol: "XAUT", amount: 0.5, usdValue: 1350 }];
      mockXautBalanceData.xautBalance = 0;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(true);
    });

    it("should return hasXautPosition=true when XAUT is among multiple assets", async () => {
      // Multiple assets including XAUT
      mockFluidData.suppliedAssets = [
        { symbol: "WBTC", amount: 0.1, usdValue: 9500 },
        { symbol: "XAUT", amount: 1.0, usdValue: 2700 },
      ];
      mockXautBalanceData.xautBalance = 0;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(true);
    });
  });

  describe("XAUT in Wallet", () => {
    it("should return hasXautPosition=true when XAUT is in wallet balance", async () => {
      // No XAUT in Fluid, but XAUT in wallet
      mockFluidData.suppliedAssets = [];
      mockXautBalanceData.xautBalance = 0.25;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(true);
    });

    it("should return hasXautPosition=true when wallet has small XAUT amount", async () => {
      // Very small XAUT amount in wallet
      mockFluidData.suppliedAssets = [];
      mockXautBalanceData.xautBalance = 0.0001;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(true);
    });
  });

  describe("XAUT in Both Places", () => {
    it("should return hasXautPosition=true when XAUT is in both Fluid and wallet", async () => {
      // XAUT in both places
      mockFluidData.suppliedAssets = [{ symbol: "XAUT", amount: 0.5, usdValue: 1350 }];
      mockXautBalanceData.xautBalance = 0.25;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.hasXautPosition).toBe(true);
    });
  });

  describe("Loading State", () => {
    it("should return isLoading=true when Fluid is loading", async () => {
      mockFluidData.isLoading = true;
      mockXautBalanceData.isLoading = false;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.isLoading).toBe(true);
    });

    it("should return isLoading=true when XautBalance is loading", async () => {
      mockFluidData.isLoading = false;
      mockXautBalanceData.isLoading = true;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.isLoading).toBe(true);
    });

    it("should return isLoading=true when both are loading", async () => {
      mockFluidData.isLoading = true;
      mockXautBalanceData.isLoading = true;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.isLoading).toBe(true);
    });

    it("should return isLoading=false when neither is loading", async () => {
      mockFluidData.isLoading = false;
      mockXautBalanceData.isLoading = false;

      const { useHasXautPosition } = await import("@/hooks/useHasXautPosition");
      const result = useHasXautPosition();

      expect(result.isLoading).toBe(false);
    });
  });
});
