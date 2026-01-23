/**
 * TDD tests for Fluid Withdraw Pre-flight Position Health Check
 *
 * These tests verify that the validateWithdrawalAmount function properly
 * validates withdrawal amounts BEFORE sending transactions, preventing
 * "Execution reverted for an unknown reason" errors.
 *
 * The validation checks:
 * 1. Withdrawal amount does not exceed available (unlocked) collateral
 * 2. Post-withdrawal LTV does not exceed maxLtv (would undercollateralize position)
 * 3. Returns user-friendly error messages instead of raw "Execution reverted"
 */
import { describe, it, expect } from "vitest";

/**
 * Pure validation logic that can be tested without React hooks
 *
 * This function mirrors the validateWithdrawalAmount logic that will be
 * added to useFluid.ts. It performs pre-flight checks before withdrawal.
 *
 * @param withdrawalAmount - Amount to withdraw in raw units (bigint)
 * @param collateralRaw - Total collateral in raw units (bigint)
 * @param borrowRaw - Total borrowed amount in raw units (bigint)
 * @param collateralPrice - Price of collateral token in USD
 * @param borrowPrice - Price of borrow token in USD
 * @param maxLtv - Maximum LTV percentage (e.g., 75 for 75%)
 * @param collateralDecimals - Decimals for collateral token (XAUT = 6)
 * @param borrowDecimals - Decimals for borrow token (USDT = 6)
 */
export function validateWithdrawalAmount(
  withdrawalAmount: bigint,
  collateralRaw: bigint,
  borrowRaw: bigint,
  collateralPrice: number,
  borrowPrice: number,
  maxLtv: number,
  collateralDecimals: number = 6,
  borrowDecimals: number = 6
): { valid: true } | { valid: false; error: string } {
  // Check 1: Cannot withdraw more than total collateral
  if (withdrawalAmount > collateralRaw) {
    return {
      valid: false,
      error: "Withdrawal amount exceeds available collateral",
    };
  }

  // If there's no borrow, any withdrawal up to collateral is valid
  if (borrowRaw === BigInt(0)) {
    return { valid: true };
  }

  // Calculate USD values
  const collateralUsd =
    (Number(collateralRaw) / 10 ** collateralDecimals) * collateralPrice;
  const borrowUsd = (Number(borrowRaw) / 10 ** borrowDecimals) * borrowPrice;
  const withdrawalUsd =
    (Number(withdrawalAmount) / 10 ** collateralDecimals) * collateralPrice;

  // Calculate locked collateral (minimum collateral needed to maintain maxLtv)
  // lockedCollateral = borrowedUSD / (maxLtv / 100)
  const lockedCollateralUsd = borrowUsd / (maxLtv / 100);

  // Calculate available (unlocked) collateral in USD
  const availableCollateralUsd = collateralUsd - lockedCollateralUsd;

  // Check 2: Cannot withdraw more than unlocked collateral
  if (withdrawalUsd > availableCollateralUsd) {
    return {
      valid: false,
      error:
        "Withdrawal would exceed available collateral. Some collateral is locked to maintain your loan health. Reduce the withdrawal amount or repay some debt to unlock more collateral.",
    };
  }

  // Check 3: Verify post-withdrawal LTV doesn't exceed maxLtv
  const postWithdrawalCollateralUsd = collateralUsd - withdrawalUsd;

  // Avoid division by zero
  if (postWithdrawalCollateralUsd <= 0) {
    return {
      valid: false,
      error:
        "Cannot withdraw entire collateral while loan is active. Repay your loan first.",
    };
  }

  const postWithdrawalLtv = (borrowUsd / postWithdrawalCollateralUsd) * 100;

  if (postWithdrawalLtv > maxLtv) {
    return {
      valid: false,
      error: `Withdrawal would cause your loan-to-value ratio (${postWithdrawalLtv.toFixed(1)}%) to exceed the maximum allowed (${maxLtv}%). Reduce withdrawal amount or repay some debt first.`,
    };
  }

  return { valid: true };
}

describe("fluidWithdrawPreflight - validateWithdrawalAmount", () => {
  // Test constants (XAUT and USDT both have 6 decimals)
  const XAUT_DECIMALS = 6;
  const USDT_DECIMALS = 6;
  const XAUT_PRICE = 2700; // $2700 per XAUT
  const USDT_PRICE = 1; // $1 per USDT
  const MAX_LTV = 75; // 75%

  describe("validates withdrawal amount against available collateral", () => {
    it("should return error when withdrawal amount exceeds total collateral", () => {
      // User has 1 XAUT collateral (1,000,000 raw units)
      const collateralRaw = BigInt(1_000_000);
      // User has $1000 USDT borrowed
      const borrowRaw = BigInt(1_000_000_000);
      // Trying to withdraw 2 XAUT (more than they have)
      const withdrawalAmount = BigInt(2_000_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("exceeds available collateral");
      }
    });

    it("should return error when withdrawal amount exceeds unlocked collateral", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1500 USDT borrowed
      // At 75% LTV, locked collateral = $1500 / 0.75 = $2000
      // Available = $2700 - $2000 = $700 (~0.259 XAUT)
      const borrowRaw = BigInt(1_500_000_000);
      // Trying to withdraw 0.5 XAUT ($1350) - more than available $700
      const withdrawalAmount = BigInt(500_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("locked");
        expect(result.error).toContain("loan health");
      }
    });
  });

  describe("validates post-withdrawal LTV against maxLtv", () => {
    it("should return error when withdrawal would cause position LTV to exceed max LTV", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1800 USDT borrowed (current LTV = 1800/2700 = 66.7%)
      const borrowRaw = BigInt(1_800_000_000);
      // Trying to withdraw 0.2 XAUT ($540)
      // Post-withdrawal collateral = $2700 - $540 = $2160
      // Post-withdrawal LTV = $1800 / $2160 = 83.3% > 75%
      const withdrawalAmount = BigInt(200_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(false);
      if (!result.valid) {
        // Check 2 triggers because withdrawal exceeds available collateral
        expect(result.error).toContain("locked");
        expect(result.error).toContain("loan health");
      }
    });

    it("should return error when trying to withdraw all collateral while loan is active", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1000 USDT borrowed
      const borrowRaw = BigInt(1_000_000_000);
      // Trying to withdraw all collateral
      const withdrawalAmount = BigInt(1_000_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(false);
      if (!result.valid) {
        // Check 2 triggers because withdrawal exceeds available collateral
        expect(result.error).toContain("locked");
        expect(result.error).toContain("repay");
      }
    });
  });

  describe("validates successful withdrawals when position stays healthy", () => {
    it("should succeed when withdrawal keeps position healthy (LTV below maxLtv)", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1000 USDT borrowed (current LTV = 37%)
      const borrowRaw = BigInt(1_000_000_000);
      // Withdrawing 0.1 XAUT ($270)
      // Post-withdrawal collateral = $2430
      // Post-withdrawal LTV = $1000 / $2430 = 41.2% < 75%
      const withdrawalAmount = BigInt(100_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(true);
    });

    it("should succeed when withdrawing from a position with no borrow", () => {
      // User has 1 XAUT collateral, no borrow
      const collateralRaw = BigInt(1_000_000);
      const borrowRaw = BigInt(0);
      // Withdrawing 0.5 XAUT - should be fine with no borrow
      const withdrawalAmount = BigInt(500_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(true);
    });

    it("should succeed when withdrawing all collateral with no borrow", () => {
      // User has 1 XAUT collateral, no borrow
      const collateralRaw = BigInt(1_000_000);
      const borrowRaw = BigInt(0);
      // Withdrawing all collateral
      const withdrawalAmount = BigInt(1_000_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(true);
    });

    it("should succeed when withdrawing exactly up to the available amount", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1500 USDT borrowed
      // At 75% LTV, locked collateral = $1500 / 0.75 = $2000
      // Available = $2700 - $2000 = $700 (~0.259 XAUT = 259,259 raw units)
      const borrowRaw = BigInt(1_500_000_000);
      // Withdrawing 0.25 XAUT ($675) - just under the $700 available
      const withdrawalAmount = BigInt(250_000);

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(true);
    });
  });

  describe("returns user-friendly error messages", () => {
    it("should NOT return raw 'Execution reverted' error", () => {
      // Test that all error paths return user-friendly messages
      const testCases = [
        {
          // Exceeds total collateral
          withdrawalAmount: BigInt(2_000_000),
          collateralRaw: BigInt(1_000_000),
          borrowRaw: BigInt(0),
        },
        {
          // Exceeds unlocked collateral
          withdrawalAmount: BigInt(500_000),
          collateralRaw: BigInt(1_000_000),
          borrowRaw: BigInt(1_500_000_000),
        },
        {
          // Would exceed max LTV
          withdrawalAmount: BigInt(200_000),
          collateralRaw: BigInt(1_000_000),
          borrowRaw: BigInt(1_800_000_000),
        },
      ];

      for (const testCase of testCases) {
        const result = validateWithdrawalAmount(
          testCase.withdrawalAmount,
          testCase.collateralRaw,
          testCase.borrowRaw,
          XAUT_PRICE,
          USDT_PRICE,
          MAX_LTV,
          XAUT_DECIMALS,
          USDT_DECIMALS
        );

        if (!result.valid) {
          expect(result.error).not.toContain("Execution reverted");
          expect(result.error).not.toContain("unknown reason");
          expect(result.error.length).toBeGreaterThan(20); // Should be descriptive
        }
      }
    });

    it("should provide actionable guidance in error messages", () => {
      // When LTV would exceed max
      const result = validateWithdrawalAmount(
        BigInt(200_000),
        BigInt(1_000_000),
        BigInt(1_800_000_000),
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      if (!result.valid) {
        // Should suggest what user can do
        expect(
          result.error.includes("Reduce") || result.error.includes("repay")
        ).toBe(true);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle zero withdrawal amount", () => {
      const result = validateWithdrawalAmount(
        BigInt(0),
        BigInt(1_000_000),
        BigInt(1_000_000_000),
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(true);
    });

    it("should handle position at exactly max LTV", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // $2025 borrowed = exactly 75% LTV
      const borrowRaw = BigInt(2_025_000_000);
      // Any withdrawal should fail
      const withdrawalAmount = BigInt(1); // Even 1 raw unit

      const result = validateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      expect(result.valid).toBe(false);
    });
  });
});

describe("useFluid hook - validateWithdrawalAmount integration", () => {
  it("should have validateWithdrawalAmount exported from useFluid.ts", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
    const hookCode = fs.readFileSync(hookPath, "utf-8");

    // Should export validateWithdrawalAmount function
    expect(hookCode).toContain("validateWithdrawalAmount");
  });

  it("should call validateWithdrawalAmount before encoding withdraw transaction", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
    const hookCode = fs.readFileSync(hookPath, "utf-8");

    // Find the withdraw function
    const withdrawMatch = hookCode.match(
      /const withdraw\s*=\s*useCallback\s*\(\s*async[^{]*\{([\s\S]*?)\n\s*\},\s*\[/
    );
    expect(withdrawMatch).not.toBeNull();

    const withdrawBody = withdrawMatch![1];

    // Validation should happen BEFORE encodeFluidWithdraw
    const validationIndex = withdrawBody.indexOf("validateWithdrawalAmount");
    const encodeIndex = withdrawBody.indexOf("encodeFluidWithdraw");

    expect(validationIndex).toBeGreaterThan(-1);
    expect(encodeIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeLessThan(encodeIndex);
  });

  it("should return user-friendly error from withdraw when validation fails", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
    const hookCode = fs.readFileSync(hookPath, "utf-8");

    // Withdraw function should return validation error
    expect(hookCode).toMatch(/!validation\.valid/);
    expect(hookCode).toMatch(/validation\.error/);
  });
});
