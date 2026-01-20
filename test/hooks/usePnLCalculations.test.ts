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
import { renderHook } from "@testing-library/react";

// Create mock functions that we can configure per test
const mockUseWalletBalanceContext = vi.fn();
const mockUsePriceHistory = vi.fn();
const mockUseLoanCalculationsContext = vi.fn();
const mockUseReferral = vi.fn();
const mockUseTokenPrices = vi.fn();

// Mock dependencies - use factory functions for dynamic return values
vi.mock("@/hooks/useWalletBalanceContext", () => ({
    useWalletBalanceContext: () => mockUseWalletBalanceContext(),
}));

vi.mock("@/hooks/usePriceHistory", () => ({
    usePriceHistory: () => mockUsePriceHistory(),
}));

vi.mock("@/providers/LoanCalculationsProvider", () => ({
    useLoanCalculationsContext: () => mockUseLoanCalculationsContext(),
}));

vi.mock("@/hooks/useReferral", () => ({
    useReferral: () => mockUseReferral(),
}));

vi.mock("@/providers/TokenPriceProvider", () => ({
    useTokenPrices: () => mockUseTokenPrices(),
}));

// Helper to set up default mocks (non-loading state)
function setupDefaultMocks() {
    mockUseWalletBalanceContext.mockReturnValue({
        assets: [],
        totalBalance: 0,
        isLoading: false,
    });
    mockUseTokenPrices.mockReturnValue({});
    mockUsePriceHistory.mockReturnValue({ isLoading: false });
    mockUseLoanCalculationsContext.mockReturnValue({
        netLoanValue: 0,
        collateralValue: 0,
        borrowedValue: 0,
        isLoading: false,
    });
    mockUseReferral.mockReturnValue({
        data: { total_earnings: 0, inflation_avoided: 0 },
        loading: false, // Note: hook uses 'loading' not 'isLoading'
    });
}

// Import hook once - mocks are configured per test via mockReturnValue
import { usePnLCalculations } from "@/hooks/usePnLCalculations";

describe("usePnLCalculations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDefaultMocks();
    });

    describe("Total PnL Calculation", () => {
        it("should calculate total PnL from assets", () => {
            // Mock current wallet state
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 0.5, usdValue: 47500 },
                    { symbol: "ETH", amount: 2.0, usdValue: 7000 },
                    { symbol: "USDT", amount: 1000, usdValue: 1000 },
                ],
                totalBalance: 55500,
                isLoading: false,
            });

            // Mock current prices
            mockUseTokenPrices.mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
                ETH: { usd: 3500, usd_24h_change: 1.5 },
                USDT: { usd: 1, usd_24h_change: 0 },
            });

            // Mock price history (for cost basis simulation - prices 30 days ago)
            mockUsePriceHistory.mockReturnValue({
                WBTC: { price24hAgo: 92000, price7dAgo: 90000, price30dAgo: 85000 },
                ETH: { price24hAgo: 3400, price7dAgo: 3300, price30dAgo: 3200 },
                USDT: { price24hAgo: 1, price7dAgo: 1, price30dAgo: 1 },
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            // Hook is synchronous - no waitFor needed
            expect(result.current.isLoading).toBe(false);

            // Total value should match wallet balance
            expect(result.current.totalValue).toBe(55500);

            // Total PnL should be positive (prices went up from 30 days ago)
            expect(result.current.totalPnL).toBeGreaterThan(0);
        });

        it("should calculate total PnL percentage", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 100000 },
                ],
                totalBalance: 100000,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                WBTC: { usd: 100000, usd_24h_change: 5.0 },
            });

            mockUsePriceHistory.mockReturnValue({
                WBTC: { price24hAgo: 95238, price7dAgo: 90000, price30dAgo: 80000 },
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);
            expect(result.current.totalPnLPercent).toBeDefined();
            expect(typeof result.current.totalPnLPercent).toBe("number");
        });
    });

    describe("24h Change Calculation", () => {
        it("should calculate 24h change from price history", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 97500 },
                ],
                totalBalance: 97500,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                WBTC: { usd: 97500, usd_24h_change: 2.5 },
            });

            mockUsePriceHistory.mockReturnValue({
                WBTC: { price24hAgo: 95000, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);

            // 24h change: 1 WBTC * (97500 - 95000) = $2500
            expect(result.current.change24h.amount).toBeCloseTo(2500, 0);
            // Percent: (97500 - 95000) / 95000 * 100 = 2.63%
            expect(result.current.change24h.percent).toBeCloseTo(2.63, 1);
        });

        it("should handle negative 24h change", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 93000 },
                ],
                totalBalance: 93000,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                WBTC: { usd: 93000, usd_24h_change: -2.1 },
            });

            mockUsePriceHistory.mockReturnValue({
                WBTC: { price24hAgo: 95000, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);

            // 24h change should be negative
            expect(result.current.change24h.amount).toBeLessThan(0);
            expect(result.current.change24h.percent).toBeLessThan(0);
        });
    });

    describe("Missing Price Data Handling", () => {
        it("should handle missing price data gracefully", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 1.0, usdValue: 0 },
                    { symbol: "UNKNOWN", amount: 100, usdValue: 0 },
                ],
                totalBalance: 0,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                WBTC: null,
                UNKNOWN: undefined,
            });

            mockUsePriceHistory.mockReturnValue({
                WBTC: null,
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);

            // Should not crash, should return defaults
            expect(result.current.totalValue).toBe(0);
            expect(result.current.totalPnL).toBe(0);
            expect(result.current.change24h.amount).toBe(0);
        });

        it("should show loading while fetching price data", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [],
                totalBalance: 0,
                isLoading: true,
            });

            mockUseTokenPrices.mockReturnValue({});

            mockUsePriceHistory.mockReturnValue({
                isLoading: true,
            });

            mockUseLoanCalculationsContext.mockReturnValue({
                netLoanValue: 0,
                collateralValue: 0,
                borrowedValue: 0,
                isLoading: true,
            });

            mockUseReferral.mockReturnValue({
                data: null,
                loading: true,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(true);
        });
    });

    describe("By Asset Breakdown", () => {
        it("should return PnL breakdown by asset", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "WBTC", name: "Wrapped Bitcoin", amount: 0.5, usdValue: 47500 },
                    { symbol: "ETH", name: "Ethereum", amount: 2.0, usdValue: 7000 },
                ],
                totalBalance: 54500,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
                ETH: { usd: 3500, usd_24h_change: -1.0 },
            });

            mockUsePriceHistory.mockReturnValue({
                WBTC: { price24hAgo: 92500, price7dAgo: 90000, price30dAgo: 85000 },
                ETH: { price24hAgo: 3535, price7dAgo: 3300, price30dAgo: 3200 },
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);

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
        it("should include holdings PnL", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "WBTC", amount: 0.5, usdValue: 47500 },
                ],
                totalBalance: 47500,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
            });

            mockUsePriceHistory.mockReturnValue({
                WBTC: { price24hAgo: 92500, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);
            expect(result.current.bySource).toBeDefined();
            expect(typeof result.current.bySource.holdings).toBe("number");
        });

        it("should include lending PnL from collateral appreciation", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [],
                totalBalance: 0,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                WBTC: { usd: 95000, usd_24h_change: 2.5 },
            });

            mockUsePriceHistory.mockReturnValue({
                WBTC: { price24hAgo: 92500, price7dAgo: 90000, price30dAgo: 85000 },
                isLoading: false,
            });

            // User has collateral in lending protocol
            mockUseLoanCalculationsContext.mockReturnValue({
                netLoanValue: 5000,
                collateralValue: 15000,
                borrowedValue: 10000,
                collateralPnL: 1500,
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);
            expect(result.current.bySource.lending).toBeGreaterThanOrEqual(0);
        });

        it("should include referral earnings", () => {
            // User has referral earnings
            mockUseReferral.mockReturnValue({
                data: {
                    total_earnings: 250.50,
                    inflation_avoided: 50.00,
                },
                loading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);
            expect(result.current.bySource.referrals).toBe(250.50);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty wallet", () => {
            // Default mocks already set up empty wallet
            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);
            expect(result.current.totalValue).toBe(0);
            expect(result.current.totalPnL).toBe(0);
            expect(result.current.byAsset).toEqual([]);
        });

        it("should handle stablecoins correctly (minimal PnL)", () => {
            mockUseWalletBalanceContext.mockReturnValue({
                assets: [
                    { symbol: "USDT", amount: 10000, usdValue: 10000 },
                ],
                totalBalance: 10000,
                isLoading: false,
            });

            mockUseTokenPrices.mockReturnValue({
                USDT: { usd: 1.0, usd_24h_change: 0.01 },
            });

            mockUsePriceHistory.mockReturnValue({
                USDT: { price24hAgo: 1.0, price7dAgo: 1.0, price30dAgo: 1.0 },
                isLoading: false,
            });

            const { result } = renderHook(() => usePnLCalculations());

            expect(result.current.isLoading).toBe(false);

            // USDT should have ~0 PnL
            const usdt = result.current.byAsset.find(a => a.symbol === "USDT");
            expect(usdt?.amount).toBeCloseTo(0, 1);
            expect(usdt?.percent).toBeCloseTo(0, 1);
        });
    });
});
