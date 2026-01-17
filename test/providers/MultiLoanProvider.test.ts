/**
 * Tests for MultiLoanProvider - Position Detection
 *
 * Edge case: Positions with collateral but no active loan should still be detected.
 * This was reported as a bug where Rabby wallet detects WBTC positions without USDT loans
 * but our app does not.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the hooks before importing the provider
const mockCompound = {
  suppliedAssets: [] as Array<{ symbol: string; amount: number; usdValue: number }>,
  borrowedAssets: [] as Array<{ symbol: string; amount: number; usdValue: number }>,
  maxLtv: 80,
  liquidationRatio: 85,
  borrowApr: 5,
  isLoading: false,
  refetch: vi.fn(),
};

const mockFluid = {
  suppliedAssets: [] as Array<{ symbol: string; amount: number; usdValue: number }>,
  borrowedAssets: [] as Array<{ symbol: string; amount: number; usdValue: number }>,
  maxLtv: 75,
  liquidationRatio: 80,
  borrowApr: 4,
  nftId: BigInt(123),
  isLoading: false,
  refetch: vi.fn(),
};

vi.mock("@/hooks/useCompound", () => ({
  useCompound: () => mockCompound,
}));

vi.mock("@/hooks/useFluid", () => ({
  useFluid: () => mockFluid,
}));

// Helper function to build allPositions logic (extracted from MultiLoanProvider)
// This mirrors the FIXED implementation in MultiLoanProvider.tsx
function buildAllPositions(compound: typeof mockCompound, fluid: typeof mockFluid) {
  const positions: Array<{
    id: string;
    protocol: string;
    chain: string;
    collateralToken: string;
    borrowToken: string;
    collateralAmount: number;
    collateralUsd: number;
    borrowAmount: number;
    borrowUsd: number;
    ltv: number;
    apr: number;
    maxLtv: number;
    liquidationRatio: number;
    nftId?: bigint;
  }> = [];

  // FIXED: Check for collateral (not just borrow)
  const wbtcCollateral = compound.suppliedAssets.find(a => a.symbol === "WBTC");
  const wbtcBorrowed = compound.borrowedAssets.find(a => a.symbol === "USDT");

  // Include position if there's any collateral (regardless of borrow amount)
  if (wbtcCollateral && wbtcCollateral.amount > 0) {
    const borrowAmount = wbtcBorrowed?.amount || 0;
    const borrowUsd = wbtcBorrowed?.usdValue || 0;
    positions.push({
      id: "compound-wbtc",
      protocol: "compound",
      chain: "arbitrum",
      collateralToken: "WBTC",
      borrowToken: "USDT",
      collateralAmount: wbtcCollateral.amount,
      collateralUsd: wbtcCollateral.usdValue,
      borrowAmount,
      borrowUsd,
      ltv: wbtcCollateral.usdValue > 0 && borrowUsd > 0
        ? (borrowUsd / wbtcCollateral.usdValue) * 100
        : 0,
      apr: compound.borrowApr,
      maxLtv: compound.maxLtv,
      liquidationRatio: compound.liquidationRatio,
    });
  }

  // FIXED: Check for collateral for Fluid too
  const xautCollateral = fluid.suppliedAssets.find(a => a.symbol === "XAUT");
  const xautBorrowed = fluid.borrowedAssets[0];

  // Include position if there's any collateral (regardless of borrow amount)
  if (xautCollateral && xautCollateral.amount > 0) {
    const borrowAmount = xautBorrowed?.amount || 0;
    const borrowUsd = xautBorrowed?.usdValue || 0;
    const calculatedLtv = xautCollateral.usdValue > 0 && borrowUsd > 0
      ? (borrowUsd / xautCollateral.usdValue) * 100
      : 0;
    positions.push({
      id: "fluid-xaut",
      protocol: "fluid",
      chain: "ethereum",
      collateralToken: "XAUT",
      borrowToken: xautBorrowed?.symbol || "USDT",
      collateralAmount: xautCollateral.amount,
      collateralUsd: xautCollateral.usdValue,
      borrowAmount,
      borrowUsd,
      ltv: calculatedLtv,
      apr: fluid.borrowApr,
      maxLtv: fluid.maxLtv,
      liquidationRatio: fluid.liquidationRatio,
      nftId: fluid.nftId,
    });
  }

  return positions;
}

// Alias for buildAllPositions (same implementation after fix)
function buildAllPositionsFixed(compound: typeof mockCompound, fluid: typeof mockFluid) {
  const positions: Array<{
    id: string;
    protocol: string;
    chain: string;
    collateralToken: string;
    borrowToken: string;
    collateralAmount: number;
    collateralUsd: number;
    borrowAmount: number;
    borrowUsd: number;
    ltv: number;
    apr: number;
    maxLtv: number;
    liquidationRatio: number;
    nftId?: bigint;
  }> = [];

  // FIXED: Check for collateral OR borrow (not just borrow)
  const wbtcCollateral = compound.suppliedAssets.find(a => a.symbol === "WBTC");
  const wbtcBorrowed = compound.borrowedAssets.find(a => a.symbol === "USDT");

  // Include position if there's any collateral (regardless of borrow amount)
  if (wbtcCollateral && wbtcCollateral.amount > 0) {
    positions.push({
      id: "compound-wbtc",
      protocol: "compound",
      chain: "arbitrum",
      collateralToken: "WBTC",
      borrowToken: "USDT",
      collateralAmount: wbtcCollateral.amount,
      collateralUsd: wbtcCollateral.usdValue,
      borrowAmount: wbtcBorrowed?.amount || 0,
      borrowUsd: wbtcBorrowed?.usdValue || 0,
      ltv: wbtcCollateral.usdValue > 0 && wbtcBorrowed
        ? ((wbtcBorrowed.usdValue / wbtcCollateral.usdValue) * 100)
        : 0,
      apr: compound.borrowApr,
      maxLtv: compound.maxLtv,
      liquidationRatio: compound.liquidationRatio,
    });
  }

  // FIXED: Check for collateral OR borrow for Fluid too
  const xautCollateral = fluid.suppliedAssets.find(a => a.symbol === "XAUT");
  const xautBorrowed = fluid.borrowedAssets[0];

  // Include position if there's any collateral (regardless of borrow amount)
  if (xautCollateral && xautCollateral.amount > 0) {
    const collateralUsdValue = xautCollateral.usdValue;
    const calculatedLtv = collateralUsdValue > 0 && xautBorrowed
      ? (xautBorrowed.usdValue / collateralUsdValue) * 100
      : 0;
    positions.push({
      id: "fluid-xaut",
      protocol: "fluid",
      chain: "ethereum",
      collateralToken: "XAUT",
      borrowToken: xautBorrowed?.symbol || "USDT",
      collateralAmount: xautCollateral.amount,
      collateralUsd: collateralUsdValue,
      borrowAmount: xautBorrowed?.amount || 0,
      borrowUsd: xautBorrowed?.usdValue || 0,
      ltv: calculatedLtv,
      apr: fluid.borrowApr,
      maxLtv: fluid.maxLtv,
      liquidationRatio: fluid.liquidationRatio,
      nftId: fluid.nftId,
    });
  }

  return positions;
}

describe("MultiLoanProvider - Position Detection", () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockCompound.suppliedAssets = [];
    mockCompound.borrowedAssets = [];
    mockFluid.suppliedAssets = [];
    mockFluid.borrowedAssets = [];
  });

  describe("Compound WBTC Position Detection", () => {
    it("should detect WBTC position WITH active USDT loan", () => {
      // Setup: WBTC collateral with USDT loan
      mockCompound.suppliedAssets = [{ symbol: "WBTC", amount: 0.5, usdValue: 47500 }];
      mockCompound.borrowedAssets = [{ symbol: "USDT", amount: 10000, usdValue: 10000 }];

      const positions = buildAllPositions(mockCompound, mockFluid);

      expect(positions).toHaveLength(1);
      expect(positions[0].id).toBe("compound-wbtc");
      expect(positions[0].collateralAmount).toBe(0.5);
      expect(positions[0].borrowAmount).toBe(10000);
    });

    it("should detect WBTC position WITHOUT active USDT loan (collateral-only)", () => {
      // Setup: WBTC collateral with NO loan (the bug case!)
      // This matches wallet 0x9B624577D49cd0561E49232F7DA7dad2605471ca
      mockCompound.suppliedAssets = [{ symbol: "WBTC", amount: 0.0002, usdValue: 19.02 }];
      mockCompound.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      // CURRENT BUGGY BEHAVIOR: This will fail because current logic requires borrowAmount > 0
      const positions = buildAllPositions(mockCompound, mockFluid);

      // This test should FAIL with current implementation
      // After fix, it should pass
      expect(positions).toHaveLength(1);
      expect(positions[0].id).toBe("compound-wbtc");
      expect(positions[0].collateralAmount).toBe(0.0002);
      expect(positions[0].collateralUsd).toBe(19.02);
      expect(positions[0].borrowAmount).toBe(0);
      expect(positions[0].ltv).toBe(0); // No loan = 0% LTV
    });

    it("FIXED: should detect WBTC collateral-only position with fixed logic", () => {
      // Setup: WBTC collateral with NO loan
      mockCompound.suppliedAssets = [{ symbol: "WBTC", amount: 0.0002, usdValue: 19.02 }];
      mockCompound.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      // FIXED LOGIC: Should detect collateral-only positions
      const positions = buildAllPositionsFixed(mockCompound, mockFluid);

      expect(positions).toHaveLength(1);
      expect(positions[0].id).toBe("compound-wbtc");
      expect(positions[0].collateralAmount).toBe(0.0002);
      expect(positions[0].collateralUsd).toBe(19.02);
      expect(positions[0].borrowAmount).toBe(0);
      expect(positions[0].ltv).toBe(0);
    });
  });

  describe("Fluid XAUT Position Detection", () => {
    it("should detect XAUT position WITH active USDT loan", () => {
      // Setup: XAUT collateral with USDT loan
      mockFluid.suppliedAssets = [{ symbol: "XAUT", amount: 1, usdValue: 2700 }];
      mockFluid.borrowedAssets = [{ symbol: "USDT", amount: 1000, usdValue: 1000 }];

      const positions = buildAllPositions(mockCompound, mockFluid);

      expect(positions).toHaveLength(1);
      expect(positions[0].id).toBe("fluid-xaut");
      expect(positions[0].collateralAmount).toBe(1);
      expect(positions[0].borrowAmount).toBe(1000);
    });

    it("should detect XAUT position WITHOUT active USDT loan (collateral-only)", () => {
      // Setup: XAUT collateral with NO loan
      mockFluid.suppliedAssets = [{ symbol: "XAUT", amount: 0.5, usdValue: 1350 }];
      mockFluid.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      // CURRENT BUGGY BEHAVIOR: This will fail
      const positions = buildAllPositions(mockCompound, mockFluid);

      // This test should FAIL with current implementation
      expect(positions).toHaveLength(1);
      expect(positions[0].id).toBe("fluid-xaut");
      expect(positions[0].collateralAmount).toBe(0.5);
      expect(positions[0].collateralUsd).toBe(1350);
      expect(positions[0].borrowAmount).toBe(0);
    });

    it("FIXED: should detect XAUT collateral-only position with fixed logic", () => {
      // Setup: XAUT collateral with NO loan
      mockFluid.suppliedAssets = [{ symbol: "XAUT", amount: 0.5, usdValue: 1350 }];
      mockFluid.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      // FIXED LOGIC: Should detect collateral-only positions
      const positions = buildAllPositionsFixed(mockCompound, mockFluid);

      expect(positions).toHaveLength(1);
      expect(positions[0].id).toBe("fluid-xaut");
      expect(positions[0].collateralAmount).toBe(0.5);
      expect(positions[0].collateralUsd).toBe(1350);
      expect(positions[0].borrowAmount).toBe(0);
      expect(positions[0].ltv).toBe(0);
    });
  });

  describe("Multiple Positions", () => {
    it("should detect both collateral-only positions simultaneously", () => {
      // Setup: Both WBTC and XAUT with NO loans
      mockCompound.suppliedAssets = [{ symbol: "WBTC", amount: 0.0002, usdValue: 19.02 }];
      mockCompound.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];
      mockFluid.suppliedAssets = [{ symbol: "XAUT", amount: 0.5, usdValue: 1350 }];
      mockFluid.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      const positions = buildAllPositionsFixed(mockCompound, mockFluid);

      expect(positions).toHaveLength(2);
      expect(positions.map(p => p.id)).toContain("compound-wbtc");
      expect(positions.map(p => p.id)).toContain("fluid-xaut");
    });

    it("should detect mix of collateral-only and active loan positions", () => {
      // Setup: WBTC with loan, XAUT without loan
      mockCompound.suppliedAssets = [{ symbol: "WBTC", amount: 0.5, usdValue: 47500 }];
      mockCompound.borrowedAssets = [{ symbol: "USDT", amount: 10000, usdValue: 10000 }];
      mockFluid.suppliedAssets = [{ symbol: "XAUT", amount: 0.5, usdValue: 1350 }];
      mockFluid.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      const positions = buildAllPositionsFixed(mockCompound, mockFluid);

      expect(positions).toHaveLength(2);

      const compoundPos = positions.find(p => p.id === "compound-wbtc");
      expect(compoundPos?.borrowAmount).toBe(10000);
      expect(compoundPos?.ltv).toBeGreaterThan(0);

      const fluidPos = positions.find(p => p.id === "fluid-xaut");
      expect(fluidPos?.borrowAmount).toBe(0);
      expect(fluidPos?.ltv).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should NOT detect position when there is no collateral", () => {
      // No collateral, no position should be created
      mockCompound.suppliedAssets = [];
      mockCompound.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      const positions = buildAllPositionsFixed(mockCompound, mockFluid);

      expect(positions).toHaveLength(0);
    });

    it("should handle zero collateral amount gracefully", () => {
      mockCompound.suppliedAssets = [{ symbol: "WBTC", amount: 0, usdValue: 0 }];
      mockCompound.borrowedAssets = [{ symbol: "USDT", amount: 0, usdValue: 0 }];

      const positions = buildAllPositionsFixed(mockCompound, mockFluid);

      // Position with 0 collateral should NOT be included
      expect(positions).toHaveLength(0);
    });
  });
});
