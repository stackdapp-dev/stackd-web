/**
 * TDD Tests for AssetPnLCard Component (PnLByAssetCard)
 *
 * This card displays PnL breakdown by individual asset:
 * - Each asset with its PnL amount and percentage
 * - Best/worst performing assets highlighted
 * - Bar chart visualization (optional)
 *
 * Follows the design from IMPLEMENTATION_PLAN.md Card 2: PnL by Asset
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

// Mock the hooks that provide PnL data
vi.mock("@/hooks/usePnLCalculations", () => ({
    usePnLCalculations: vi.fn(),
}));

// The component doesn't exist yet - this is TDD
describe("AssetPnLCard (PnLByAssetCard)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockAssetPnLData = {
        byAsset: [
            { symbol: "WBTC", name: "Wrapped Bitcoin", amount: 1180.00, percent: 5.5, usdValue: 22580.00 },
            { symbol: "ETH", name: "Ethereum", amount: 54.56, percent: 2.1, usdValue: 2654.56 },
            { symbol: "USDT", name: "Tether", amount: 0.00, percent: 0.0, usdValue: 1000.00 },
        ],
        isLoading: false,
    };

    describe("Asset List Display", () => {
        it("should list each asset with its PnL", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            // Each asset should be displayed
            expect(screen.getByText("WBTC")).toBeInTheDocument();
            expect(screen.getByText("ETH")).toBeInTheDocument();
            expect(screen.getByText("USDT")).toBeInTheDocument();
        });

        it("should show PnL amount for each asset", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            // Check WBTC PnL
            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(within(wbtcRow).getByTestId("asset-pnl-amount")).toHaveTextContent("+$1,180.00");
            expect(within(wbtcRow).getByTestId("asset-pnl-percent")).toHaveTextContent("+5.50%");

            // Check ETH PnL
            const ethRow = screen.getByTestId("asset-row-ETH");
            expect(within(ethRow).getByTestId("asset-pnl-amount")).toHaveTextContent("+$54.56");
            expect(within(ethRow).getByTestId("asset-pnl-percent")).toHaveTextContent("+2.10%");

            // Check USDT PnL (zero/stable)
            const usdtRow = screen.getByTestId("asset-row-USDT");
            expect(within(usdtRow).getByTestId("asset-pnl-amount")).toHaveTextContent("$0.00");
            expect(within(usdtRow).getByTestId("asset-pnl-percent")).toHaveTextContent("0.00%");
        });

        it("should show asset icons", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(within(wbtcRow).getByTestId("asset-icon")).toBeInTheDocument();
        });
    });

    describe("Best/Worst Performing Assets", () => {
        it("should highlight best performing asset", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            // WBTC has highest PnL percent (5.5%), should be marked as best
            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(wbtcRow).toHaveAttribute("data-performance", "best");

            // Or check for a badge/indicator
            expect(within(wbtcRow).getByTestId("best-performer-badge")).toBeInTheDocument();
        });

        it("should highlight worst performing asset when negative", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [
                    { symbol: "WBTC", name: "Wrapped Bitcoin", amount: 500.00, percent: 2.5, usdValue: 20500.00 },
                    { symbol: "ETH", name: "Ethereum", amount: -150.00, percent: -5.0, usdValue: 2850.00 },
                    { symbol: "USDT", name: "Tether", amount: 0.00, percent: 0.0, usdValue: 1000.00 },
                ],
                isLoading: false,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            // ETH has worst PnL (-5.0%), should be marked as worst
            const ethRow = screen.getByTestId("asset-row-ETH");
            expect(ethRow).toHaveAttribute("data-performance", "worst");
            expect(within(ethRow).getByTestId("worst-performer-badge")).toBeInTheDocument();
        });

        it("should sort assets by PnL percentage descending", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [
                    { symbol: "ETH", name: "Ethereum", amount: 100.00, percent: 3.0, usdValue: 3433.00 },
                    { symbol: "WBTC", name: "Wrapped Bitcoin", amount: 500.00, percent: 5.0, usdValue: 10500.00 },
                    { symbol: "USDT", name: "Tether", amount: 0.00, percent: 0.0, usdValue: 1000.00 },
                ],
                isLoading: false,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            const assetRows = screen.getAllByTestId(/asset-row-/);

            // Assets should be sorted: WBTC (5%), ETH (3%), USDT (0%)
            expect(assetRows[0]).toHaveAttribute("data-symbol", "WBTC");
            expect(assetRows[1]).toHaveAttribute("data-symbol", "ETH");
            expect(assetRows[2]).toHaveAttribute("data-symbol", "USDT");
        });
    });

    describe("Color Coding", () => {
        it("should show green for positive PnL assets", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(within(wbtcRow).getByTestId("asset-pnl-amount")).toHaveClass("text-green-500");
        });

        it("should show red for negative PnL assets", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [
                    { symbol: "WBTC", name: "Wrapped Bitcoin", amount: -200.00, percent: -1.0, usdValue: 19800.00 },
                ],
                isLoading: false,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(within(wbtcRow).getByTestId("asset-pnl-amount")).toHaveClass("text-red-500");
            expect(within(wbtcRow).getByTestId("asset-pnl-amount")).toHaveTextContent("-$200.00");
        });

        it("should show neutral color for zero PnL assets", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            const usdtRow = screen.getByTestId("asset-row-USDT");
            expect(within(usdtRow).getByTestId("asset-pnl-amount")).toHaveClass("text-white/60");
        });
    });

    describe("Empty State", () => {
        it("should handle empty asset list", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [],
                isLoading: false,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            expect(screen.getByTestId("empty-assets-message")).toBeInTheDocument();
            expect(screen.getByText(/no assets found/i)).toBeInTheDocument();
        });

        it("should display helpful message when no assets", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [],
                isLoading: false,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            expect(screen.getByText(/deposit assets to see pnl breakdown/i)).toBeInTheDocument();
        });
    });

    describe("Loading State", () => {
        it("should show loading skeleton when data is loading", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [],
                isLoading: true,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            expect(screen.getByTestId("asset-pnl-loading-skeleton")).toBeInTheDocument();
        });
    });

    describe("Card Styling", () => {
        it("should have glass card styling", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            const card = screen.getByTestId("pnl-by-asset-card");
            expect(card).toHaveClass("backdrop-blur-xl");
            expect(card).toHaveClass("bg-white/5");
            expect(card).toHaveClass("rounded-2xl");
        });

        it("should display card title", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            expect(screen.getByText(/pnl by asset/i)).toBeInTheDocument();
        });
    });

    describe("USD Value Display", () => {
        it("should display current USD value for each asset", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue(mockAssetPnLData);

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(within(wbtcRow).getByTestId("asset-usd-value")).toHaveTextContent("$22,580.00");
        });
    });

    describe("Single Asset", () => {
        it("should handle single asset correctly", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [
                    { symbol: "WBTC", name: "Wrapped Bitcoin", amount: 500.00, percent: 2.5, usdValue: 20500.00 },
                ],
                isLoading: false,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            // Single asset should still be marked as best (it's both best and worst)
            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(wbtcRow).toHaveAttribute("data-performance", "best");

            // Should not have worst badge when only one positive asset
            expect(within(wbtcRow).queryByTestId("worst-performer-badge")).not.toBeInTheDocument();
        });
    });

    describe("All Negative PnL", () => {
        it("should mark least negative as best when all are negative", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                byAsset: [
                    { symbol: "WBTC", name: "Wrapped Bitcoin", amount: -500.00, percent: -2.5, usdValue: 19500.00 },
                    { symbol: "ETH", name: "Ethereum", amount: -200.00, percent: -6.0, usdValue: 3133.00 },
                ],
                isLoading: false,
            });

            const { PnLByAssetCard } = await import("@/components/wallet/pnl/PnLByAssetCard");

            render(<PnLByAssetCard />);

            // WBTC is least negative (-2.5%), should be "best"
            const wbtcRow = screen.getByTestId("asset-row-WBTC");
            expect(wbtcRow).toHaveAttribute("data-performance", "best");

            // ETH is most negative (-6.0%), should be "worst"
            const ethRow = screen.getByTestId("asset-row-ETH");
            expect(ethRow).toHaveAttribute("data-performance", "worst");
        });
    });
});
