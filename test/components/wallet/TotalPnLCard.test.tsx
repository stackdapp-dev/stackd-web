/**
 * TDD Tests for TotalPnLCard Component (PnLOverviewCard)
 *
 * This card displays the total portfolio PnL including:
 * - Total portfolio value in USD
 * - 24h change amount and percentage
 * - Visual indicators for positive/negative changes
 *
 * Follows the design from IMPLEMENTATION_PLAN.md Card 1: Total PnL Overview
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the hooks that provide PnL data
vi.mock("@/hooks/usePnLCalculations", () => ({
    usePnLCalculations: vi.fn(),
}));

vi.mock("@/hooks/useWalletBalance", () => ({
    useWalletBalanceContext: vi.fn(),
}));

// The component doesn't exist yet - this is TDD
describe("TotalPnLCard (PnLOverviewCard)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Portfolio Value Display", () => {
        it("should display total portfolio value", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 12345.67,
                totalPnL: 1234.56,
                totalPnLPercent: 10.5,
                change24h: { amount: 45.00, percent: 0.37 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            // Should display formatted total value
            expect(screen.getByTestId("total-portfolio-value")).toHaveTextContent("$12,345.67");
        });

        it("should display total PnL amount", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 12345.67,
                totalPnL: 1234.56,
                totalPnLPercent: 10.5,
                change24h: { amount: 45.00, percent: 0.37 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            expect(screen.getByTestId("total-pnl")).toHaveTextContent("+$1,234.56");
            expect(screen.getByTestId("total-pnl-percent")).toHaveTextContent("+10.50%");
        });

        it("should abbreviate large portfolio values", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 1500000,
                totalPnL: 150000,
                totalPnLPercent: 11.11,
                change24h: { amount: 5000, percent: 0.33 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            expect(screen.getByTestId("total-portfolio-value")).toHaveTextContent("$1.5M");
        });
    });

    describe("24h Change Display", () => {
        it("should show 24h change amount and percentage", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: 500,
                totalPnLPercent: 5.0,
                change24h: { amount: 45.00, percent: 0.45 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            expect(screen.getByTestId("change-24h-amount")).toHaveTextContent("+$45.00");
            expect(screen.getByTestId("change-24h-percent")).toHaveTextContent("+0.45%");
        });

        it("should show green color for positive 24h change", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: 500,
                totalPnLPercent: 5.0,
                change24h: { amount: 45.00, percent: 0.45 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const change24hAmount = screen.getByTestId("change-24h-amount");
            expect(change24hAmount).toHaveClass("text-green-500");
        });

        it("should show red color for negative 24h change", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: -200,
                totalPnLPercent: -2.0,
                change24h: { amount: -150.00, percent: -1.48 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const change24hAmount = screen.getByTestId("change-24h-amount");
            expect(change24hAmount).toHaveClass("text-red-500");
            expect(change24hAmount).toHaveTextContent("-$150.00");

            const change24hPercent = screen.getByTestId("change-24h-percent");
            expect(change24hPercent).toHaveClass("text-red-500");
            expect(change24hPercent).toHaveTextContent("-1.48%");
        });

        it("should handle zero change with neutral styling", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: 0,
                totalPnLPercent: 0,
                change24h: { amount: 0, percent: 0 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const change24hAmount = screen.getByTestId("change-24h-amount");
            expect(change24hAmount).toHaveClass("text-white/60");
            expect(change24hAmount).toHaveTextContent("$0.00");

            const change24hPercent = screen.getByTestId("change-24h-percent");
            expect(change24hPercent).toHaveTextContent("0.00%");
        });
    });

    describe("Total PnL Color Indicators", () => {
        it("should show green for positive total PnL", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 11000,
                totalPnL: 1000,
                totalPnLPercent: 10.0,
                change24h: { amount: 50, percent: 0.45 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const totalPnl = screen.getByTestId("total-pnl");
            expect(totalPnl).toHaveClass("text-green-500");
        });

        it("should show red for negative total PnL", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 9000,
                totalPnL: -1000,
                totalPnLPercent: -10.0,
                change24h: { amount: -50, percent: -0.55 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const totalPnl = screen.getByTestId("total-pnl");
            expect(totalPnl).toHaveClass("text-red-500");
            expect(totalPnl).toHaveTextContent("-$1,000.00");
        });

        it("should show neutral color for zero PnL", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: 0,
                totalPnLPercent: 0,
                change24h: { amount: 0, percent: 0 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const totalPnl = screen.getByTestId("total-pnl");
            expect(totalPnl).toHaveClass("text-white/60");
        });
    });

    describe("Loading State", () => {
        it("should show loading skeleton when data is loading", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 0,
                totalPnL: 0,
                totalPnLPercent: 0,
                change24h: { amount: 0, percent: 0 },
                isLoading: true,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            expect(screen.getByTestId("pnl-loading-skeleton")).toBeInTheDocument();
        });

        it("should not show loading skeleton when data is loaded", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: 500,
                totalPnLPercent: 5.0,
                change24h: { amount: 45, percent: 0.45 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            expect(screen.queryByTestId("pnl-loading-skeleton")).not.toBeInTheDocument();
        });
    });

    describe("Card Styling", () => {
        it("should have glass card styling", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: 500,
                totalPnLPercent: 5.0,
                change24h: { amount: 45, percent: 0.45 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const card = screen.getByTestId("pnl-overview-card");
            expect(card).toHaveClass("backdrop-blur-xl");
            expect(card).toHaveClass("bg-white/5");
            expect(card).toHaveClass("rounded-2xl");
        });

        it("should display card title", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 10000,
                totalPnL: 500,
                totalPnLPercent: 5.0,
                change24h: { amount: 45, percent: 0.45 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            expect(screen.getByText(/total pnl/i)).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("should handle very small positive values", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 100.01,
                totalPnL: 0.01,
                totalPnLPercent: 0.01,
                change24h: { amount: 0.005, percent: 0.005 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const totalPnl = screen.getByTestId("total-pnl");
            // Should still show green for positive
            expect(totalPnl).toHaveClass("text-green-500");
        });

        it("should handle very small negative values", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: 99.99,
                totalPnL: -0.01,
                totalPnLPercent: -0.01,
                change24h: { amount: -0.005, percent: -0.005 },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            const totalPnl = screen.getByTestId("total-pnl");
            // Should still show red for negative
            expect(totalPnl).toHaveClass("text-red-500");
        });

        it("should handle null/undefined data gracefully", async () => {
            const { usePnLCalculations } = await import("@/hooks/usePnLCalculations");
            (usePnLCalculations as any).mockReturnValue({
                totalValue: null,
                totalPnL: undefined,
                totalPnLPercent: undefined,
                change24h: { amount: null, percent: null },
                isLoading: false,
            });

            const { PnLOverviewCard } = await import("@/components/wallet/pnl/PnLOverviewCard");

            render(<PnLOverviewCard />);

            // Should display $0 for null values
            expect(screen.getByTestId("total-portfolio-value")).toHaveTextContent("$0");
        });
    });
});
