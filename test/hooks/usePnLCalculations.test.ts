/**
 * @vitest-environment jsdom
 */
/**
 * TDD Tests for usePnLCalculations Hook
 *
 * This hook aggregates PnL data from multiple sources:
 * - Token balances and current prices (useWalletBalance)
 * - Historical prices for change calculations (usePriceHistory)
 * - Loan positions (useLoanCalculations)
 * - Referral earnings (useReferral)
 *
 * Expected interface:
 * {
 *   totalValue: number;           // Current total portfolio value in USD
 *   totalPnL: number;             // Total unrealized PnL in USD
 *   totalPnLPercent: number;      // Total PnL as percentage
 *   change24h: { amount: number; percent: number };  // 24h change
 *   byAsset: AssetPnL[];          // PnL breakdown by asset
 *   bySource: SourcePnL;          // PnL breakdown by source
 *   isLoading: boolean;
 * }
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock dependencies - paths must match actual imports in usePnLCalculations.ts
vi.mock("@/app/(main)/wallet/layout", () => ({
    useWalletBalanceContext: vi.fn(),
}));

vi.mock("@/hooks/usePriceHistory", () => ({
    usePriceHistory: vi.fn(),
}));

vi.mock("@/providers/LoanCalculationsProvider", () => ({
    useLoanCalculationsContext: vi.fn(),
}));

vi.mock("@/hooks/useReferral", () => ({
    useReferral: vi.fn(),
}));

vi.mock("@/providers/TokenPriceProvider", () => ({
    useTokenPrices: vi.fn(),
}));

describe("usePnLCalculations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Total PnL Calculation", () => {
        it("should calculate total PnL from assets", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            // Mock current wallet state
            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 0.5, usdValue: 47500 }, // Current value
                    { symbol: "ETH", amount: 2.0, usdValue: 7000 },
                    { symbol: "USDT", amount: 1000, usdValue: 1000 },
                ],
                totalBalance: 55500,
                isLoading: false,
            });

            // Mock current prices
            (useTokenPrices as any).mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
                ETH: { usd: 3500, usd_24h_change: 1.5 },
                USDT: { usd: 1, usd_24h_change: 0 },
            });

            // Mock price history (for cost basis simulation - prices 30 days ago)
            (usePriceHistory as any).mockReturnValue({
                WBTC: { price24hAgo: 92000, price7dAgo: 90000, price30dAgo: 85000 },
                ETH: { price24hAgo: 3400, price7dAgo: 3300, price30dAgo: 3200 },
                USDT: { price24hAgo: 1, price7dAgo: 1, price30dAgo: 1 },
                isLoading: false,
            });

            // Mock loan calculations
            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0,
                collateralValue: 0,
                borrowedValue: 0,
                isLoading: false,
            });

            // Mock referral earnings
            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 },
                isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Total value should match wallet balance
            expect(result.current.totalValue).toBe(55500);

            // Total PnL calculation:
            // WBTC: bought at $85k, now $95k = (95000-85000)/85000 * 47500 = +$5588.24 unrealized
            // ETH: bought at $3.2k, now $3.5k = (3500-3200)/3200 * 7000 = +$656.25
            // USDT: always $1, PnL = $0
            // This is a simplification - actual implementation may differ
            expect(result.current.totalPnL).toBeGreaterThan(0);
        });

        it("should calculate total PnL percentage", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 100000 },
                ],
                totalBalance: 100000,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                WBTC: { usd: 100000, usd_24h_change: 5.0 },
            });

            (usePriceHistory as any).mockReturnValue({
                WBTC: { price24hAgo: 95238, price7dAgo: 90000, price30dAgo: 80000 },
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // PnL percent should be calculated
            expect(result.current.totalPnLPercent).toBeDefined();
            expect(typeof result.current.totalPnLPercent).toBe("number");
        });
    });

    describe("24h Change Calculation", () => {
        it("should calculate 24h change from price history", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 97500 }, // 97.5k current
                ],
                totalBalance: 97500,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                WBTC: { usd: 97500, usd_24h_change: 2.5 },
            });

            (usePriceHistory as any).mockReturnValue({
                WBTC: { price24hAgo: 95000, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // 24h change: 1 WBTC * (97500 - 95000) = $2500
            expect(result.current.change24h.amount).toBeCloseTo(2500, 0);
            // Percent: (97500 - 95000) / 95000 * 100 = 2.63%
            expect(result.current.change24h.percent).toBeCloseTo(2.63, 1);
        });

        it("should handle negative 24h change", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 93000 },
                ],
                totalBalance: 93000,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                WBTC: { usd: 93000, usd_24h_change: -2.1 },
            });

            (usePriceHistory as any).mockReturnValue({
                WBTC: { price24hAgo: 95000, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // 24h change should be negative
            expect(result.current.change24h.amount).toBeLessThan(0);
            expect(result.current.change24h.percent).toBeLessThan(0);
        });
    });

    describe("Missing Price Data Handling", () => {
        it("should handle missing price data gracefully", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 0 }, // No price data yet
                    { symbol: "UNKNOWN", amount: 100, usdValue: 0 },
                ],
                totalBalance: 0,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                WBTC: null, // Missing price
                UNKNOWN: undefined, // Unknown token
            });

            (usePriceHistory as any).mockReturnValue({
                WBTC: null,
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Should not crash, should return defaults
            expect(result.current.totalValue).toBe(0);
            expect(result.current.totalPnL).toBe(0);
            expect(result.current.change24h.amount).toBe(0);
        });

        it("should show loading while fetching price data", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [],
                totalBalance: 0,
                isLoading: true, // Still loading
            });

            (useTokenPrices as any).mockReturnValue({});

            (usePriceHistory as any).mockReturnValue({
                isLoading: true,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: true,
            });

            (useReferral as any).mockReturnValue({
                data: null, isLoading: true,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(true);
        });
    });

    describe("By Asset Breakdown", () => {
        it("should return PnL breakdown by asset", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "WBTC", name: "Wrapped Bitcoin", amount: 0.5, usdValue: 47500 },
                    { symbol: "ETH", name: "Ethereum", amount: 2.0, usdValue: 7000 },
                ],
                totalBalance: 54500,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
                ETH: { usd: 3500, usd_24h_change: -1.0 },
            });

            (usePriceHistory as any).mockReturnValue({
                WBTC: { price24hAgo: 92500, price7dAgo: 90000, price30dAgo: 85000 },
                ETH: { price24hAgo: 3535, price7dAgo: 3300, price30dAgo: 3200 },
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Should have byAsset array
            expect(result.current.byAsset).toBeInstanceOf(Array);
            expect(result.current.byAsset.length).toBe(2);

            // Each asset should have symbol, amount, percent
            const wbtc = result.current.byAsset.find(a => a.symbol === "WBTC");
            expect(wbtc).toBeDefined();
            expect(wbtc?.symbol).toBe("WBTC");
            expect(typeof wbtc?.amount).toBe("number");
            expect(typeof wbtc?.percent).toBe("number");
        });
    });

    describe("By Source Breakdown", () => {
        it("should include holdings PnL", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 0.5, usdValue: 47500 },
                ],
                totalBalance: 47500,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
            });

            (usePriceHistory as any).mockReturnValue({
                WBTC: { price24hAgo: 92500, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.bySource).toBeDefined();
            expect(typeof result.current.bySource.holdings).toBe("number");
        });

        it("should include lending PnL from collateral appreciation", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [],
                totalBalance: 0,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
            });

            (usePriceHistory as any).mockReturnValue({
                WBTC: { price24hAgo: 92500, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            // User has collateral in lending protocol
            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 5000, // Net value of position
                collateralValue: 15000, // Collateral appreciated
                borrowedValue: 10000,
                collateralPnL: 1500, // Appreciation
                isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.bySource.lending).toBeGreaterThanOrEqual(0);
        });

        it("should include referral earnings", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [],
                totalBalance: 0,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({});

            (usePriceHistory as any).mockReturnValue({
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            // User has referral earnings
            (useReferral as any).mockReturnValue({
                data: {
                    total_earnings: 250.50,
                    inflation_avoided: 50.00,
                },
                isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.bySource.referrals).toBe(250.50);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty wallet", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [],
                totalBalance: 0,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({});
            (usePriceHistory as any).mockReturnValue({ isLoading: false });
            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });
            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.totalValue).toBe(0);
            expect(result.current.totalPnL).toBe(0);
            expect(result.current.byAsset).toEqual([]);
        });

        it("should handle stablecoins correctly (minimal PnL)", async () => {
            const { useWalletBalanceContext } = await import("@/app/(main)/wallet/layout");
            const { useTokenPrices } = await import("@/providers/TokenPriceProvider");
            const { usePriceHistory } = await import("@/hooks/usePriceHistory");
            const { useLoanCalculationsContext } = await import("@/providers/LoanCalculationsProvider");
            const { useReferral } = await import("@/hooks/useReferral");

            (useWalletBalanceContext as any).mockReturnValue({
                assets: [
                    { symbol: "USDT", amount: 10000, usdValue: 10000 },
                ],
                totalBalance: 10000,
                isLoading: false,
            });

            (useTokenPrices as any).mockReturnValue({
                USDT: { usd: 1.0, usd_24h_change: 0.01 },
            });

            (usePriceHistory as any).mockReturnValue({
                USDT: { price24hAgo: 1.0, price7dAgo: 1.0, price30dAgo: 1.0 },
                isLoading: false,
            });

            (useLoanCalculationsContext as any).mockReturnValue({
                netLoanValue: 0, collateralValue: 0, borrowedValue: 0, isLoading: false,
            });

            (useReferral as any).mockReturnValue({
                data: { total_earnings: 0, inflation_avoided: 0 }, isLoading: false,
            });

            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            const { result } = renderHook(() => usePnLCalculations());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // USDT should have ~0 PnL
            const usdt = result.current.byAsset.find(a => a.symbol === "USDT");
            expect(usdt?.amount).toBeCloseTo(0, 1);
            expect(usdt?.percent).toBeCloseTo(0, 1);
        });
    });
});
