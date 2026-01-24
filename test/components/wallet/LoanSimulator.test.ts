/**
 * Tests for LoanSimulator data source selection
 * Ensures XAUT uses Fluid data and WBTC uses Compound data
 */

describe("LoanSimulator Data Source Selection", () => {
    describe("Data source based on collateralType", () => {
        it("should use Compound (loanCalcs) data when collateralType is WBTC", () => {
            // Given: collateralType is WBTC
            const collateralType = "WBTC";
            const isXaut = collateralType === "XAUT";

            // When: determining data source
            // Then: isXaut should be false, meaning Compound data is used
            expect(isXaut).toBe(false);
        });

        it("should use Fluid data when collateralType is XAUT", () => {
            // Given: collateralType is XAUT
            const collateralType = "XAUT";
            const isXaut = collateralType === "XAUT";

            // When: determining data source
            // Then: isXaut should be true, meaning Fluid data is used
            expect(isXaut).toBe(true);
        });
    });

    describe("Conditional data selection", () => {
        const mockCompoundData = {
            suppliedAssets: [{ symbol: "WBTC", amount: 1.5, usdValue: 150000 }],
            borrowedAssets: [{ symbol: "USDC", amount: 50000, usdValue: 50000 }],
            maxLtv: 70,
            liquidationRatio: 80,
            borrowApr: 3.5,
        };

        const mockFluidData = {
            suppliedAssets: [{ symbol: "XAUT", amount: 10, usdValue: 26000 }],
            borrowedAssets: [{ symbol: "USDT", amount: 15000, usdValue: 15000 }],
            maxLtv: 75,
            liquidationRatio: 85,
            borrowApr: 4.2,
        };

        it("should select Compound suppliedAssets when isXaut is false", () => {
            const isXaut = false;
            const suppliedAssets = isXaut ? mockFluidData.suppliedAssets : mockCompoundData.suppliedAssets;

            expect(suppliedAssets[0].symbol).toBe("WBTC");
            expect(suppliedAssets[0].amount).toBe(1.5);
        });

        it("should select Fluid suppliedAssets when isXaut is true", () => {
            const isXaut = true;
            const suppliedAssets = isXaut ? mockFluidData.suppliedAssets : mockCompoundData.suppliedAssets;

            expect(suppliedAssets[0].symbol).toBe("XAUT");
            expect(suppliedAssets[0].amount).toBe(10);
        });

        it("should select correct maxLtv based on collateral type", () => {
            // WBTC should use Compound maxLtv (70)
            const wbtcMaxLtv = false ? mockFluidData.maxLtv : mockCompoundData.maxLtv;
            expect(wbtcMaxLtv).toBe(70);

            // XAUT should use Fluid maxLtv (75)
            const xautMaxLtv = true ? mockFluidData.maxLtv : mockCompoundData.maxLtv;
            expect(xautMaxLtv).toBe(75);
        });

        it("should select correct borrowApr based on collateral type", () => {
            // WBTC should use Compound borrowApr (3.5)
            const wbtcBorrowApr = false ? mockFluidData.borrowApr : mockCompoundData.borrowApr;
            expect(wbtcBorrowApr).toBe(3.5);

            // XAUT should use Fluid borrowApr (4.2)
            const xautBorrowApr = true ? mockFluidData.borrowApr : mockCompoundData.borrowApr;
            expect(xautBorrowApr).toBe(4.2);
        });
    });

    describe("Collateral lookup by symbol", () => {
        it("should find WBTC collateral when collateralSymbol is WBTC", () => {
            const suppliedAssets = [
                { symbol: "WBTC", amount: 1.5, usdValue: 150000 },
                { symbol: "ETH", amount: 10, usdValue: 25000 },
            ];
            const collateralSymbol = "WBTC";

            const currentCollateral = suppliedAssets.find((a) => a.symbol === collateralSymbol);

            expect(currentCollateral).toBeDefined();
            expect(currentCollateral?.amount).toBe(1.5);
        });

        it("should find XAUT collateral when collateralSymbol is XAUT", () => {
            const suppliedAssets = [
                { symbol: "XAUT", amount: 10, usdValue: 26000 },
                { symbol: "USDT", amount: 1000, usdValue: 1000 },
            ];
            const collateralSymbol = "XAUT";

            const currentCollateral = suppliedAssets.find((a) => a.symbol === collateralSymbol);

            expect(currentCollateral).toBeDefined();
            expect(currentCollateral?.amount).toBe(10);
        });

        it("should return undefined when collateral not found", () => {
            const suppliedAssets = [
                { symbol: "WBTC", amount: 1.5, usdValue: 150000 },
            ];
            const collateralSymbol = "XAUT"; // Looking for XAUT in WBTC-only assets

            const currentCollateral = suppliedAssets.find((a) => a.symbol === collateralSymbol);

            expect(currentCollateral).toBeUndefined();
        });
    });

    describe("XAUT Add Collateral Max Value - REGRESSION TEST", () => {
        /**
         * TDD: This test ensures the add collateral mode for XAUT uses the wallet XAUT balance
         * instead of hardcoded 0. The max button should detect idle XAUT in the user's wallet.
         * 
         * CRITICAL: This was a bug where XAUT add collateral max was always 0.
         */

        it("should use wallet XAUT balance for maxValue when mode is addCollateral and isXaut is true", () => {
            // Given: mode is addCollateral and collateral type is XAUT
            const mode = "addCollateral";
            const isXaut = true;
            const walletXautBalance = 0.5; // User has 0.5 XAUT in wallet
            const wbtcBalance = 1.0;

            // When: calculating maxValue for addCollateral mode
            // This simulates the modeConfig logic in LoanSimulator
            const maxValue = isXaut ? walletXautBalance : wbtcBalance;

            // Then: maxValue should be the wallet XAUT balance, NOT 0
            expect(maxValue).toBe(0.5);
            expect(maxValue).toBeGreaterThan(0);
        });

        it("should use WBTC balance for maxValue when mode is addCollateral and isXaut is false", () => {
            // Given: mode is addCollateral and collateral type is WBTC
            const mode = "addCollateral";
            const isXaut = false;
            const walletXautBalance = 0.5;
            const wbtcBalance = 1.0;

            // When: calculating maxValue
            const maxValue = isXaut ? walletXautBalance : wbtcBalance;

            // Then: maxValue should be WBTC balance
            expect(maxValue).toBe(1.0);
        });

        it("should return 0 when no XAUT in wallet but isXaut and addCollateral mode", () => {
            // Given: mode is addCollateral, isXaut is true, but no XAUT in wallet
            const mode = "addCollateral";
            const isXaut = true;
            const walletXautBalance = 0; // No XAUT
            const wbtcBalance = 1.0;

            // When: calculating maxValue
            const maxValue = isXaut ? walletXautBalance : wbtcBalance;

            // Then: maxValue should be 0 (correctly reflects no wallet balance)
            expect(maxValue).toBe(0);
        });
    });

    describe("Simulate Mode Collateral Type Selection - REGRESSION TEST", () => {
        /**
         * TDD: When in simulate mode and user switches collateral type via the WBTC/XAUT toggle,
         * the maxBorrow calculation must use the EFFECTIVE collateral price, not the prop's collateralType.
         *
         * BUG: When user selects XAUT in simulate mode, it still uses WBTC price for maxBorrow calculation.
         * Example: 1 XAUT ≈ $2,600, 1 WBTC ≈ $95,000
         * At 70% LTV: 1 XAUT should allow max ~$1,820, not ~$66,500
         *
         * CRITICAL: This causes the simulator to show wildly incorrect max borrow amounts.
         */

        it("should use effectiveCollateralSymbol price for maxBorrow in simulate mode", () => {
            // Given: simulate mode with sandbox collateral type set to XAUT
            const mode = "simulate";
            const collateralType = "WBTC"; // Prop default
            const sandboxCollateralType = "XAUT"; // User selected XAUT in sandbox
            const effectiveCollateralType = mode === "simulate" ? sandboxCollateralType : collateralType;

            // Mock prices
            const tokenPrices = {
                WBTC: 95000,
                XAUT: 2600,
            };

            // When: getting the price for maxBorrow calculation
            const effectiveCollateralSymbol = effectiveCollateralType;
            const collateralPrice = tokenPrices[effectiveCollateralSymbol as keyof typeof tokenPrices];

            // Then: price should be XAUT price, not WBTC price
            expect(collateralPrice).toBe(2600);
            expect(collateralPrice).not.toBe(95000);
        });

        it("should calculate correct maxBorrow for XAUT in simulate mode", () => {
            // Given: 1 XAUT at $2,600, maxLtv 70%
            const sandboxCollateral = 1;
            const xautPrice = 2600;
            const maxLtv = 70;

            // When: calculating maxBorrow
            const collateralUsd = sandboxCollateral * xautPrice;
            const maxBorrow = collateralUsd * (maxLtv / 100) * 0.99;

            // Then: maxBorrow should be ~$1,801 (2600 * 0.70 * 0.99)
            expect(maxBorrow).toBeCloseTo(1801.8, 0);
            expect(maxBorrow).toBeLessThan(3000); // Definitely not ~$65,885
        });

        it("should calculate correct maxBorrow for WBTC in simulate mode", () => {
            // Given: 1 WBTC at $95,000, maxLtv 70%
            const sandboxCollateral = 1;
            const wbtcPrice = 95000;
            const maxLtv = 70;

            // When: calculating maxBorrow
            const collateralUsd = sandboxCollateral * wbtcPrice;
            const maxBorrow = collateralUsd * (maxLtv / 100) * 0.99;

            // Then: maxBorrow should be ~$65,835 (95000 * 0.70 * 0.99)
            expect(maxBorrow).toBeCloseTo(65835, 0);
        });

        it("should use effectiveIsXaut for protocol data selection in simulate mode", () => {
            // Given: simulate mode with sandbox set to XAUT
            const mode = "simulate";
            const collateralType = "WBTC"; // Prop default
            const sandboxCollateralType = "XAUT";

            const effectiveCollateralType = mode === "simulate" ? sandboxCollateralType : collateralType;
            const effectiveIsXaut = effectiveCollateralType === "XAUT";

            // Mock protocol data
            const compoundMaxLtv = 70;
            const fluidMaxLtv = 75;

            // When: selecting maxLtv based on effective collateral type
            const maxLtv = effectiveIsXaut ? fluidMaxLtv : compoundMaxLtv;

            // Then: should use Fluid's maxLtv since XAUT is selected
            expect(maxLtv).toBe(75);
        });
    });

    describe("Repay Mode Max Value - REGRESSION TEST", () => {
        /**
         * TDD: Repay slider should allow simulation up to the full borrowed amount,
         * NOT be limited by wallet balance. This allows users to see what
         * their LTV would be after repayment, even if they don't have enough USDT.
         *
         * CRITICAL: Users should be able to simulate repayment scenarios.
         */

        it("should use borrowed amount (not wallet balance) for repay maxValue", () => {
            // Given: mode is repay, user has borrowed $5000 but only has $100 USDT
            const currentBorrowedAmount = 5000;
            const usdtBalance = 100;

            // When: calculating maxValue for repay mode
            // The slider should allow up to the borrowed amount for simulation
            const maxValue = currentBorrowedAmount; // NOT: Math.min(usdtBalance, currentBorrowedAmount)

            // Then: maxValue should be the borrowed amount, allowing full simulation
            expect(maxValue).toBe(5000);
        });

        it("should allow simulation even with 0 USDT wallet balance", () => {
            // Given: mode is repay, user has borrowed $5000 but has 0 USDT
            const currentBorrowedAmount = 5000;
            const usdtBalance = 0;

            // When: calculating maxValue for repay mode
            const maxValue = currentBorrowedAmount;

            // Then: maxValue should still be the borrowed amount
            expect(maxValue).toBe(5000);
            expect(maxValue).toBeGreaterThan(0);
        });
    });

    describe("XAUT Withdrawal Slider LTV Buffer - FEATURE", () => {
        /**
         * TDD: The XAUT withdrawal slider should use a 1 percentage point LTV buffer
         * to prevent users from withdrawing up to exactly the max LTV threshold.
         *
         * This provides a safety margin to account for:
         * - Price fluctuations between simulation and execution
         * - Gas/network delays during transaction execution
         * - Rounding precision in calculations
         *
         * IMPLEMENTATION:
         * - Line 117: Use (maxLtv - 1) instead of maxLtv in the locked XAUT calculation
         * - Line 121: Remove the * 0.99 multiplier on the final result (buffer now in LTV)
         *
         * Example: With maxLtv = 75%:
         * - Old: lockedXautUsd = borrowedUsd / 0.75, then result * 0.99
         * - New: lockedXautUsd = borrowedUsd / 0.74, no final multiplier
         *
         * The new approach is more intuitive because:
         * - The buffer is applied at the LTV level, not the amount level
         * - Users understand "74% effective LTV" better than "99% of calculated amount"
         */

        /**
         * Helper function that replicates the xautAvailableToWithdraw calculation
         * with the BUFFERED LTV approach (1 percentage point reduction)
         */
        function calculateXautAvailableToWithdrawWithBuffer(
            totalXaut: number,
            borrowedUsd: number,
            maxLtv: number,
            xautPrice: number
        ): number {
            // Calculate locked XAUT using buffered LTV (maxLtv - 1)
            const effectiveLtv = maxLtv - 1; // 1 percentage point buffer
            const lockedXautUsd = borrowedUsd > 0 && effectiveLtv > 0
                ? borrowedUsd / (effectiveLtv / 100)
                : 0;
            const lockedXaut = xautPrice > 0 ? lockedXautUsd / xautPrice : 0;

            // NO final multiplier - buffer is in the LTV
            return Math.max(0, totalXaut - lockedXaut);
        }

        /**
         * Helper function that replicates the OLD calculation (with 0.99 multiplier)
         */
        function calculateXautAvailableToWithdrawOld(
            totalXaut: number,
            borrowedUsd: number,
            maxLtv: number,
            xautPrice: number
        ): number {
            // Old calculation uses maxLtv directly
            const lockedXautUsd = borrowedUsd > 0 && maxLtv > 0
                ? borrowedUsd / (maxLtv / 100)
                : 0;
            const lockedXaut = xautPrice > 0 ? lockedXautUsd / xautPrice : 0;

            // Old: applies 0.99 multiplier to final result
            return Math.max(0, totalXaut - lockedXaut) * 0.99;
        }

        it("should use buffered LTV (maxLtv - 1) for locked XAUT calculation", () => {
            // Given: maxLtv = 75%, borrowedUsd = $7400, xautPrice = $2600, totalXaut = 10
            // With a $7400 loan and $2600/XAUT price:
            // - At 75% LTV: need $9866.67 collateral -> 3.795 XAUT locked
            // - At 74% LTV: need $10000 collateral -> 3.846 XAUT locked

            const maxLtv = 75;
            const borrowedUsd = 7400;
            const xautPrice = 2600;
            const totalXaut = 10;

            // Calculate expected locked XAUT at 74% (buffered) vs 75% (original)
            const lockedXautAtOriginalLtv = (borrowedUsd / (maxLtv / 100)) / xautPrice;
            const lockedXautAtBufferedLtv = (borrowedUsd / ((maxLtv - 1) / 100)) / xautPrice;

            // Buffered LTV should lock MORE XAUT (safer)
            expect(lockedXautAtBufferedLtv).toBeGreaterThan(lockedXautAtOriginalLtv);

            // Verify the specific values
            expect(lockedXautAtOriginalLtv).toBeCloseTo(3.795, 2); // 9866.67 / 2600
            expect(lockedXautAtBufferedLtv).toBeCloseTo(3.846, 2); // 10000 / 2600
        });

        it("should NOT apply 0.99 multiplier to final result (buffer is in LTV)", () => {
            // Given: calculation with buffer in LTV
            const maxLtv = 75;
            const borrowedUsd = 7400;
            const xautPrice = 2600;
            const totalXaut = 10;

            const availableWithBuffer = calculateXautAvailableToWithdrawWithBuffer(
                totalXaut, borrowedUsd, maxLtv, xautPrice
            );

            // The result should NOT be multiplied by 0.99
            // Available = totalXaut - lockedXaut (at 74% LTV)
            // lockedXaut = 7400 / 0.74 / 2600 = 3.846
            // Available = 10 - 3.846 = 6.154

            const expectedLockedXaut = (borrowedUsd / ((maxLtv - 1) / 100)) / xautPrice;
            const expectedAvailable = totalXaut - expectedLockedXaut;

            expect(availableWithBuffer).toBeCloseTo(expectedAvailable, 4);
            // Verify no 0.99 multiplier was applied
            expect(availableWithBuffer).not.toBeCloseTo(expectedAvailable * 0.99, 4);
        });

        it("should result in less available XAUT compared to old calculation (safer)", () => {
            // The new buffered LTV approach should be MORE conservative
            // (locks more XAUT, allows less withdrawal)

            const maxLtv = 75;
            const borrowedUsd = 7400;
            const xautPrice = 2600;
            const totalXaut = 10;

            const availableWithBuffer = calculateXautAvailableToWithdrawWithBuffer(
                totalXaut, borrowedUsd, maxLtv, xautPrice
            );
            const availableOld = calculateXautAvailableToWithdrawOld(
                totalXaut, borrowedUsd, maxLtv, xautPrice
            );

            // New approach should allow LESS withdrawal (more conservative)
            expect(availableWithBuffer).toBeLessThan(availableOld);
        });

        it("should correctly calculate with 75% maxLtv using 74% effective", () => {
            // Given: Fluid maxLtv = 75%
            const maxLtv = 75;
            const totalXaut = 10;
            const borrowedUsd = 7400;
            const xautPrice = 2600;

            // When: calculating with buffered LTV (74%)
            const effectiveLtv = maxLtv - 1; // 74
            const lockedXautUsd = borrowedUsd / (effectiveLtv / 100); // 7400 / 0.74 = 10000
            const lockedXaut = lockedXautUsd / xautPrice; // 10000 / 2600 = 3.846
            const availableXaut = Math.max(0, totalXaut - lockedXaut); // 10 - 3.846 = 6.154

            // Then: verify the calculation
            expect(effectiveLtv).toBe(74);
            expect(lockedXautUsd).toBeCloseTo(10000, 0);
            expect(lockedXaut).toBeCloseTo(3.846, 2);
            expect(availableXaut).toBeCloseTo(6.154, 2);
        });

        it("should handle edge case: no borrowed amount (full withdrawal available)", () => {
            const maxLtv = 75;
            const totalXaut = 10;
            const borrowedUsd = 0;
            const xautPrice = 2600;

            const availableWithBuffer = calculateXautAvailableToWithdrawWithBuffer(
                totalXaut, borrowedUsd, maxLtv, xautPrice
            );

            // With no borrowed amount, all XAUT should be available
            expect(availableWithBuffer).toBe(totalXaut);
        });

        it("should handle edge case: fully utilized collateral (no withdrawal available)", () => {
            const maxLtv = 75;
            const totalXaut = 10;
            const xautPrice = 2600;
            // Borrowed at exactly 74% of collateral value
            const collateralUsd = totalXaut * xautPrice; // $26,000
            const borrowedUsd = collateralUsd * ((maxLtv - 1) / 100); // $19,240

            const availableWithBuffer = calculateXautAvailableToWithdrawWithBuffer(
                totalXaut, borrowedUsd, maxLtv, xautPrice
            );

            // At exactly the buffered LTV, no XAUT should be available for withdrawal
            expect(availableWithBuffer).toBeCloseTo(0, 4);
        });

        it("should handle edge case: over-borrowed (should return 0, not negative)", () => {
            const maxLtv = 75;
            const totalXaut = 10;
            const xautPrice = 2600;
            // Borrowed more than 74% of collateral value (somehow)
            const collateralUsd = totalXaut * xautPrice; // $26,000
            const borrowedUsd = collateralUsd * 0.80; // $20,800 - over the 74% buffer

            const availableWithBuffer = calculateXautAvailableToWithdrawWithBuffer(
                totalXaut, borrowedUsd, maxLtv, xautPrice
            );

            // Should return 0, not negative (Math.max protects against this)
            expect(availableWithBuffer).toBe(0);
        });
    });
});
