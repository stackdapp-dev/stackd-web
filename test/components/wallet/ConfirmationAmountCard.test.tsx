/**
 * @vitest-environment jsdom
 */

/**
 * Tests for ConfirmationAmountCard Component
 *
 * The ConfirmationAmountCard component displays transaction amounts with glass effects.
 * It supports three variants (success, warning, neutral) and three display modes
 * (token, usd, both).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ConfirmationAmountCard from "@/components/wallet/ConfirmationAmountCard";

// Mock TokenIcon component
vi.mock("@/components/common/TokenIcon", () => ({
    default: ({ symbol }: { symbol: string }) => (
        <span data-testid={`token-icon-${symbol}`}>{symbol}</span>
    ),
}));

// Mock the utils module
vi.mock("@/lib/utils", () => ({
    cn: (...args: any[]) => args.filter(Boolean).join(" "),
    formatAmount: (value: number, decimals: number = 6) => {
        if (value === null || value === undefined) return "0";
        return value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: Math.min(4, Math.max(0, decimals)),
        });
    },
    formatCurrency: (value: number, decimals: number = 2) => {
        if (value === null || value === undefined) return "$0";
        return `$${value.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    },
}));

describe("ConfirmationAmountCard Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Variant Styling", () => {
        it("should apply success variant styling classes", () => {
            const { container } = render(
                <ConfirmationAmountCard
                    label="Add Collateral Amount"
                    amount={0.01}
                    tokenSymbol="XAUT"
                    variant="success"
                />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass("bg-emerald-900/10");
            expect(card).toHaveClass("border-emerald-500/20");
        });

        it("should apply warning variant styling classes", () => {
            const { container } = render(
                <ConfirmationAmountCard
                    label="Withdraw Amount"
                    amount={0.05}
                    tokenSymbol="WBTC"
                    variant="warning"
                />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass("bg-amber-500/10");
            expect(card).toHaveClass("border-amber-500/20");
        });

        it("should apply neutral variant styling classes", () => {
            const { container } = render(
                <ConfirmationAmountCard
                    label="Transfer Amount"
                    amount={100}
                    tokenSymbol="USDT"
                    variant="neutral"
                />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass("bg-white/5");
            expect(card).toHaveClass("border-white/10");
        });
    });

    describe("Hover Glow Effects", () => {
        it("should apply success hover glow classes", () => {
            const { container } = render(
                <ConfirmationAmountCard
                    label="Add Collateral"
                    amount={0.5}
                    tokenSymbol="WBTC"
                    variant="success"
                />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass("hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]");
        });

        it("should apply warning hover glow classes", () => {
            const { container } = render(
                <ConfirmationAmountCard
                    label="Remove Collateral"
                    amount={0.25}
                    tokenSymbol="WBTC"
                    variant="warning"
                />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass("hover:shadow-[0_0_20px_rgba(255,160,45,0.3)]");
        });

        it("should not apply hover glow for neutral variant", () => {
            const { container } = render(
                <ConfirmationAmountCard
                    label="Balance"
                    amount={1000}
                    tokenSymbol="USDT"
                    variant="neutral"
                />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).not.toHaveClass("hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]");
            expect(card).not.toHaveClass("hover:shadow-[0_0_20px_rgba(255,160,45,0.3)]");
        });
    });

    describe("Common Styling", () => {
        it("should apply common glass card styling", () => {
            const { container } = render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={100}
                    tokenSymbol="USDT"
                    variant="neutral"
                />
            );

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass("backdrop-blur-xl");
            expect(card).toHaveClass("rounded-2xl");
            expect(card).toHaveClass("p-6");
            expect(card).toHaveClass("border");
            expect(card).toHaveClass("transition-all");
            expect(card).toHaveClass("duration-300");
        });
    });

    describe("Display Mode - Token", () => {
        it("should display amount with token symbol in token mode", () => {
            render(
                <ConfirmationAmountCard
                    label="Add Collateral Amount"
                    amount={0.01}
                    tokenSymbol="XAUT"
                    variant="success"
                    displayMode="token"
                />
            );

            expect(screen.getByText(/0\.01/)).toBeInTheDocument();
            // Token symbol may appear in both icon and text, so use getAllByText
            expect(screen.getAllByText(/XAUT/).length).toBeGreaterThanOrEqual(1);
        });

        it("should default to token display mode when not specified", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={0.5}
                    tokenSymbol="WBTC"
                    variant="neutral"
                />
            );

            expect(screen.getByText(/0\.50/)).toBeInTheDocument();
            // Token symbol may appear in both icon and text, so use getAllByText
            expect(screen.getAllByText(/WBTC/).length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("Display Mode - USD", () => {
        it("should display USD value in usd mode", () => {
            render(
                <ConfirmationAmountCard
                    label="Value"
                    amount={0.01}
                    tokenSymbol="XAUT"
                    usdValue={20}
                    variant="success"
                    displayMode="usd"
                />
            );

            expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
        });
    });

    describe("Display Mode - Both", () => {
        it("should display USD as main and token below in both mode", () => {
            render(
                <ConfirmationAmountCard
                    label="Add Amount"
                    amount={0.01}
                    tokenSymbol="XAUT"
                    usdValue={20}
                    variant="success"
                    displayMode="both"
                />
            );

            // USD should be the main display
            expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
            // Token should be shown below (may appear in both icon and text)
            expect(screen.getAllByText(/XAUT/).length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("Label Display", () => {
        it("should display the label correctly", () => {
            render(
                <ConfirmationAmountCard
                    label="Add Collateral Amount"
                    amount={0.01}
                    tokenSymbol="XAUT"
                    variant="success"
                />
            );

            expect(screen.getByText("Add Collateral Amount")).toBeInTheDocument();
        });

        it("should display different labels correctly", () => {
            render(
                <ConfirmationAmountCard
                    label="Withdraw Amount"
                    amount={100}
                    tokenSymbol="USDT"
                    variant="warning"
                />
            );

            expect(screen.getByText("Withdraw Amount")).toBeInTheDocument();
        });
    });

    describe("Token Icon Display", () => {
        it("should show token icon by default", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={0.01}
                    tokenSymbol="XAUT"
                    variant="success"
                />
            );

            expect(screen.getByTestId("token-icon-XAUT")).toBeInTheDocument();
        });

        it("should show token icon when showIcon is true", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={0.01}
                    tokenSymbol="WBTC"
                    variant="success"
                    showIcon={true}
                />
            );

            expect(screen.getByTestId("token-icon-WBTC")).toBeInTheDocument();
        });

        it("should hide token icon when showIcon is false", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={0.01}
                    tokenSymbol="WBTC"
                    variant="success"
                    showIcon={false}
                />
            );

            expect(screen.queryByTestId("token-icon-WBTC")).not.toBeInTheDocument();
        });
    });

    describe("Amount Formatting", () => {
        it("should format small amounts correctly", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={0.0001}
                    tokenSymbol="WBTC"
                    variant="neutral"
                    displayMode="token"
                />
            );

            // formatAmount should handle small decimals
            expect(screen.getByText(/0\.0001/)).toBeInTheDocument();
        });

        it("should format large amounts correctly", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={1234.5678}
                    tokenSymbol="USDT"
                    variant="neutral"
                    displayMode="token"
                />
            );

            expect(screen.getByText(/1,234\.5678/)).toBeInTheDocument();
        });
    });

    describe("USD Value Formatting", () => {
        it("should format USD values with two decimal places", () => {
            render(
                <ConfirmationAmountCard
                    label="Value"
                    amount={1}
                    tokenSymbol="WBTC"
                    usdValue={50000}
                    variant="success"
                    displayMode="usd"
                />
            );

            expect(screen.getByText(/\$50,000\.00/)).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("should handle zero amount", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={0}
                    tokenSymbol="WBTC"
                    variant="neutral"
                />
            );

            expect(screen.getByText(/0\.00/)).toBeInTheDocument();
        });

        it("should handle missing usdValue in both mode gracefully", () => {
            render(
                <ConfirmationAmountCard
                    label="Amount"
                    amount={0.5}
                    tokenSymbol="WBTC"
                    variant="success"
                    displayMode="both"
                />
            );

            // Should still render without crashing (token symbol appears in both icon and text)
            expect(screen.getAllByText(/WBTC/).length).toBeGreaterThanOrEqual(1);
        });
    });
});
