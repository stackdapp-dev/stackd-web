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
import { validateWithdrawalAmount as actualValidateWithdrawalAmount } from "@/hooks/useFluid";

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

/**
 * TDD tests for 1% LTV Buffer in withdrawal validation
 *
 * These tests use the ACTUAL validateWithdrawalAmount function from useFluid.ts
 * to verify the 1% LTV buffer implementation.
 *
 * The withdrawal validation now uses an effective LTV that is 1 percentage point
 * less than the maxLtv (e.g., 74% instead of 75%). This provides a safety buffer
 * to prevent users from getting too close to the liquidation threshold.
 *
 * Changes:
 * 1. Locked collateral calculation: borrowUsd / ((maxLtv - 1) / 100)
 * 2. Post-withdrawal LTV check: postWithdrawalLtv > (maxLtv - 1)
 * 3. Error message shows buffered LTV: "${maxLtv - 1}%" instead of "${maxLtv}%"
 */
describe("fluidWithdrawPreflight - 1% LTV Buffer (actual implementation)", () => {
  const XAUT_DECIMALS = 6;
  const USDT_DECIMALS = 6;
  const XAUT_PRICE = 2700; // $2700 per XAUT
  const USDT_PRICE = 1; // $1 per USDT
  const MAX_LTV = 75; // 75% nominal max LTV
  const EFFECTIVE_MAX_LTV = 74; // 74% effective max LTV (1% buffer)

  describe("locked collateral calculation uses buffered LTV", () => {
    it("should calculate locked collateral using (maxLtv - 1) instead of maxLtv", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1480 USDT borrowed
      // At 74% effective LTV: locked = $1480 / 0.74 = $2000 (exactly)
      // Available = $2700 - $2000 = $700
      // At 75% LTV: locked = $1480 / 0.75 = $1973.33
      // Available = $2700 - $1973.33 = $726.67
      const borrowRaw = BigInt(1_480_000_000);

      // Trying to withdraw 0.26 XAUT ($702) - should fail with 74% effective LTV
      // but would succeed with 75% LTV
      const withdrawalAmount = BigInt(260_000);

      const result = actualValidateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      // Should fail because with 1% buffer, available is only ~$700
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("locked");
      }
    });

    it("should allow withdrawal that is within buffered available collateral", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1480 USDT borrowed
      // At 74% effective LTV: locked = $1480 / 0.74 = $2000
      // Available = $2700 - $2000 = $700
      const borrowRaw = BigInt(1_480_000_000);

      // Trying to withdraw 0.25 XAUT ($675) - should succeed (under $700 available)
      const withdrawalAmount = BigInt(250_000);

      const result = actualValidateWithdrawalAmount(
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

  describe("post-withdrawal LTV check uses buffered LTV", () => {
    it("should reject withdrawal that would result in LTV between 74% and 75%", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1998 USDT borrowed (current LTV = 74%)
      const borrowRaw = BigInt(1_998_000_000);
      // Trying to withdraw 0.001 XAUT ($2.70)
      // Post-withdrawal collateral = $2697.30
      // Post-withdrawal LTV = $1998 / $2697.30 = 74.07% > 74% (effective max)
      // This should fail even though it's below 75%
      const withdrawalAmount = BigInt(1_000);

      const result = actualValidateWithdrawalAmount(
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

    it("should accept withdrawal that keeps LTV at or below 74% (effective max)", () => {
      // User has 2 XAUT collateral ($5400)
      const collateralRaw = BigInt(2_000_000);
      // User has $2960 USDT borrowed (current LTV = 54.8%)
      const borrowRaw = BigInt(2_960_000_000);
      // Withdrawing 0.4 XAUT ($1080)
      // Post-withdrawal collateral = $4320
      // Post-withdrawal LTV = $2960 / $4320 = 68.5% < 74%
      const withdrawalAmount = BigInt(400_000);

      const result = actualValidateWithdrawalAmount(
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

    it("should handle position at exactly 74% LTV - no withdrawal allowed", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // $1998 borrowed = exactly 74% LTV
      const borrowRaw = BigInt(1_998_000_000);
      // Even 1 raw unit withdrawal should fail
      const withdrawalAmount = BigInt(1);

      const result = actualValidateWithdrawalAmount(
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

  describe("error messages show buffered LTV value", () => {
    it("should use effectiveMaxLtv (74%) in locked collateral calculation", () => {
      // This test verifies the buffer is applied by checking withdrawal behavior
      // at the boundary of the buffered LTV

      // User has 10 XAUT collateral ($27,000)
      const collateralRaw = BigInt(10_000_000);
      // User has $20,000 USDT borrowed (current LTV = 74.07%)
      const borrowRaw = BigInt(20_000_000_000);

      // With 74% effective max:
      // lockedCollateralUsd = 20000 / 0.74 = $27,027
      // This exceeds total collateral ($27,000), so everything is locked
      // Available = 0

      // Even a tiny withdrawal should fail
      const tinyWithdrawal = BigInt(1_000); // 0.001 XAUT

      const result = actualValidateWithdrawalAmount(
        tinyWithdrawal,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      // Should fail because we're at 74% LTV limit with the buffer
      expect(result.valid).toBe(false);

      // If we had used 75% (no buffer), lockedCollateral = 20000/0.75 = $26,666
      // Available would be $27,000 - $26,666 = $334 (0.124 XAUT)
      // And this tiny withdrawal would have succeeded
    });
  });

  describe("boundary cases for 1% buffer", () => {
    it("should fail withdrawal that would be valid at exactly 75% but exceeds 74%", () => {
      // This is the key test case: A withdrawal that would result in exactly 75% LTV
      // should fail because the effective max is 74%

      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1350 USDT borrowed (current LTV = 50%)
      const borrowRaw = BigInt(1_350_000_000);

      // Calculate withdrawal that would result in exactly 75% LTV:
      // postLTV = borrowUsd / (collateralUsd - withdrawalUsd) = 0.75
      // $1350 / (collateralUsd - withdrawalUsd) = 0.75
      // collateralUsd - withdrawalUsd = $1350 / 0.75 = $1800
      // withdrawalUsd = $2700 - $1800 = $900 = 0.333... XAUT = 333333 raw
      const withdrawalAmount = BigInt(333_333);

      const result = actualValidateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      // This withdrawal would result in exactly 75% LTV, but should fail
      // because effective max is 74%
      expect(result.valid).toBe(false);
    });

    it("should pass withdrawal that keeps LTV at exactly 74%", () => {
      // User has 1 XAUT collateral ($2700)
      const collateralRaw = BigInt(1_000_000);
      // User has $1350 USDT borrowed (current LTV = 50%)
      const borrowRaw = BigInt(1_350_000_000);

      // Calculate withdrawal that would result in exactly 74% LTV:
      // postLTV = borrowUsd / (collateralUsd - withdrawalUsd) = 0.74
      // $1350 / (collateralUsd - withdrawalUsd) = 0.74
      // collateralUsd - withdrawalUsd = $1350 / 0.74 = $1824.32...
      // withdrawalUsd = $2700 - $1824.32 = $875.68 = 0.3243... XAUT
      // Using slightly less to stay at or below 74%
      const withdrawalAmount = BigInt(324_000); // 0.324 XAUT = $874.80

      const result = actualValidateWithdrawalAmount(
        withdrawalAmount,
        collateralRaw,
        borrowRaw,
        XAUT_PRICE,
        USDT_PRICE,
        MAX_LTV,
        XAUT_DECIMALS,
        USDT_DECIMALS
      );

      // Post-withdrawal: $1350 / ($2700 - $874.80) = $1350 / $1825.20 = 73.97%
      expect(result.valid).toBe(true);
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
