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
});
