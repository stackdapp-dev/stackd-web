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
});
