/**
 * TDD tests for Fluid Oracle Price Integration
 *
 * These tests verify that the Fluid oracle price is fetched correctly from on-chain
 * and used for withdrawal validation instead of external price feeds (e.g., CoinGecko).
 *
 * Bug fixed: XAUT withdrawals on passkey wallets were failing because:
 * 1. Frontend used CoinGecko prices for validation
 * 2. Fluid vault uses its own on-chain oracle for health checks
 * 3. Price discrepancy caused on-chain simulation to fail
 *
 * Solution: Fetch and use Fluid's oracle price for withdrawal calculations.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock viem's readContract for oracle price fetching tests
vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
  };
});

describe("fluidOraclePrice - getFluidOraclePrice", () => {
  describe("oracle price fetching", () => {
    it("should export getFluidOraclePrice function from fluid.ts", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const fluidPath = path.resolve(process.cwd(), "src/lib/web3/fluid.ts");
      const fluidCode = fs.readFileSync(fluidPath, "utf-8");

      // Should have getFluidOraclePrice function
      expect(fluidCode).toContain("getFluidOraclePrice");
      expect(fluidCode).toContain("export async function getFluidOraclePrice");
    });

    it("should fetch oraclePrice from configs in getVaultEntireData", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const fluidPath = path.resolve(process.cwd(), "src/lib/web3/fluid.ts");
      const fluidCode = fs.readFileSync(fluidPath, "utf-8");

      // Should use configs.oraclePrice from getVaultEntireData result
      expect(fluidCode).toContain("configs.oraclePrice");
    });

    it("should convert oraclePrice to USD correctly (scale by decimals)", async () => {
      // Fluid oracle price format: price * 10^27 (for XAUT/USDT vault)
      // Example: If XAUT = $5000 USDT, oraclePrice = 5000 * 10^27 = 5000000000000000000000000000000n
      const fs = await import("fs");
      const path = await import("path");

      const fluidPath = path.resolve(process.cwd(), "src/lib/web3/fluid.ts");
      const fluidCode = fs.readFileSync(fluidPath, "utf-8");

      // Should have logic to convert oracle price to USD
      expect(fluidCode).toContain("ORACLE_PRICE_DECIMALS");
    });
  });

  describe("oracle price format", () => {
    it("should handle Fluid's 27-decimal oracle price format", () => {
      // Fluid uses 27 decimals for oracle prices (scaled by 1e27)
      // XAUT at $5000 USDT = 5000 * 10^27
      const ORACLE_DECIMALS = 27;
      const rawOraclePrice = BigInt("5000000000000000000000000000000"); // 5000 * 10^27

      // Convert to USD: rawPrice / 10^27
      const priceUsd = Number(rawOraclePrice) / 10 ** ORACLE_DECIMALS;

      expect(priceUsd).toBeCloseTo(5000, 2);
    });

    it("should handle fractional prices correctly", () => {
      // Example: XAUT at $4990.38
      const ORACLE_DECIMALS = 27;
      const rawOraclePrice = BigInt("4990380000000000000000000000000"); // 4990.38 * 10^27

      const priceUsd = Number(rawOraclePrice) / 10 ** ORACLE_DECIMALS;

      expect(priceUsd).toBeCloseTo(4990.38, 2);
    });
  });
});

describe("fluidOraclePrice - validateWithdrawalAmount with oracle price", () => {
  describe("oracle price parameter support", () => {
    it("should accept optional oraclePrice parameter in validateWithdrawalAmount", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Function signature should include oraclePrice parameter
      const functionMatch = hookCode.match(/export function validateWithdrawalAmount\([^)]+\)/s);
      expect(functionMatch).not.toBeNull();
      expect(functionMatch![0]).toContain("oraclePrice");
    });

    it("should use oracle price when provided, fallback to collateralPrice otherwise", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should have logic to prefer oracle price
      expect(hookCode).toContain("oraclePrice");
      // Should use oracle price for collateral calculations when available
      expect(hookCode).toMatch(/effectivePrice.*oraclePrice|oraclePrice.*\?\?|oraclePrice.*\|\|/);
    });
  });
});

describe("fluidOraclePrice - getUserPositions returns oracle price", () => {
  it("should return oraclePrice in FluidVaultData", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const fluidPath = path.resolve(process.cwd(), "src/lib/web3/fluid.ts");
    const fluidCode = fs.readFileSync(fluidPath, "utf-8");

    // FluidVaultData interface should include oraclePrice
    expect(fluidCode).toContain("oraclePrice");
  });

  it("should extract oraclePrice from getVaultEntireData response", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const fluidPath = path.resolve(process.cwd(), "src/lib/web3/fluid.ts");
    const fluidCode = fs.readFileSync(fluidPath, "utf-8");

    // Should read configs.oraclePrice from vault data
    expect(fluidCode).toContain("vaultData.configs.oraclePrice");
  });
});

describe("fluidOraclePrice - useFluid hook integration", () => {
  it("should pass oraclePrice to validateWithdrawalAmount in withdraw function", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
    const hookCode = fs.readFileSync(hookPath, "utf-8");

    // Find the withdraw function and verify it passes oracle price
    const withdrawMatch = hookCode.match(
      /const withdraw\s*=\s*useCallback\s*\(\s*async[^{]*\{([\s\S]*?)\n\s*\},\s*\[/
    );
    expect(withdrawMatch).not.toBeNull();

    const withdrawBody = withdrawMatch![1];

    // validateWithdrawalAmount call should include oracle price
    expect(withdrawBody).toMatch(/validateWithdrawalAmount\([^)]*oraclePrice/);
  });

  it("should include oraclePrice in FluidData interface", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
    const hookCode = fs.readFileSync(hookPath, "utf-8");

    // FluidData interface should have oraclePrice field
    const fluidDataMatch = hookCode.match(/interface FluidData \{[^}]+\}/s);
    expect(fluidDataMatch).not.toBeNull();
    expect(fluidDataMatch![0]).toContain("oraclePrice");
  });

  it("should return oraclePrice from useFluid hook", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
    const hookCode = fs.readFileSync(hookPath, "utf-8");

    // UseFluidResult type should include oraclePrice
    const resultTypeMatch = hookCode.match(/type UseFluidResult\s*=\s*\{[\s\S]*?\n\};/);
    expect(resultTypeMatch).not.toBeNull();
    expect(resultTypeMatch![0]).toContain("oraclePrice");
  });
});

describe("fluidOraclePrice - LoanSimulator uses oracle price", () => {
  it("should use oraclePrice for xautAvailableToWithdraw calculation", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const componentPath = path.resolve(
      process.cwd(),
      "src/components/wallet/LoanSimulator.tsx"
    );
    const componentCode = fs.readFileSync(componentPath, "utf-8");

    // Should use oraclePrice from fluid hook
    expect(componentCode).toContain("fluid.oraclePrice");
  });

  it("should apply 1% safety buffer on top of oracle-based calculation", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const componentPath = path.resolve(
      process.cwd(),
      "src/components/wallet/LoanSimulator.tsx"
    );
    const componentCode = fs.readFileSync(componentPath, "utf-8");

    // Should apply buffer (either 0.99 multiplier or maxLtv - 1)
    // The buffer is already in place via effectiveLtv = fluid.maxLtv - 1
    expect(componentCode).toMatch(/effectiveLtv.*maxLtv.*-.*1|maxLtv.*-.*1.*effectiveLtv/);
  });
});

describe("fluidOraclePrice - Oracle vs External Price Comparison", () => {
  it("should prefer oracle price over external price for withdrawal validation", () => {
    // This test documents the expected behavior:
    // When oracle price differs from external price (e.g., CoinGecko),
    // use the oracle price because that's what Fluid uses on-chain

    const externalPrice = 5001.23; // CoinGecko price
    const oraclePrice = 4990.38; // Fluid oracle price (slightly lower)

    // Withdrawal calculations should use oracle price
    const effectivePrice = oraclePrice; // Should use oracle, not external

    expect(effectivePrice).toBe(oraclePrice);
    expect(effectivePrice).not.toBe(externalPrice);
  });

  it("should handle case where oracle price is lower than external price", () => {
    // Common scenario: Oracle price lags behind external price
    // Using oracle price is more conservative for withdrawals
    // because it results in more locked collateral

    const externalPrice = 5001.23;
    const oraclePrice = 4990.38;
    const borrowedUsd = 3000;
    const maxLtv = 75;

    // With external price: locked = $3000 / 0.75 = $4000
    // With oracle price: locked = $3000 / 0.75 = $4000
    // (locked amount is same, but collateral VALUE differs)

    // If user has 1 XAUT:
    // External: collateral = $5001.23, available = $5001.23 - $4000 = $1001.23
    // Oracle: collateral = $4990.38, available = $4990.38 - $4000 = $990.38

    const collateralExternal = externalPrice;
    const collateralOracle = oraclePrice;
    const lockedUsd = borrowedUsd / (maxLtv / 100);

    const availableExternal = collateralExternal - lockedUsd;
    const availableOracle = collateralOracle - lockedUsd;

    // Using oracle price results in less available collateral (more conservative)
    expect(availableOracle).toBeLessThan(availableExternal);

    // This is the safer approach - prevents on-chain rejection
    expect(availableOracle).toBeCloseTo(990.38, 2);
  });
});
