/**
 * @vitest-environment jsdom
 */

/**
 * TDD Tests for Borrow Confirmation Modal - NET Amount Display
 *
 * Issue: The borrow confirmation modal should clearly show the NET borrow amount
 * (the new amount being borrowed) IN ADDITION TO existing debt.
 *
 * Requirements:
 * - Primary display: NET borrow amount (the new amount being borrowed, e.g., $1.00)
 * - Clear indication this is IN ADDITION TO existing debt
 * - Value Change section shows: Existing debt -> New total debt (e.g., $13.91 -> $14.91)
 *
 * Example:
 * - User has $13.91 existing debt
 * - User is borrowing $1.00 more
 * - Modal should show:
 *   - "New Borrow Amount: $1.00" (the net new borrow)
 *   - "Current Debt: $13.91 -> $14.91" (showing the change)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LoanConfirmationModal from "@/components/wallet/LoanConfirmationModal";

// Mock Modal component
vi.mock("@/components/ui/modal", () => ({
    default: ({
        isOpen,
        title,
        message,
        icon,
    }: {
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        icon?: React.ReactNode;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal">
                <div data-testid="modal-title">{title}</div>
                {icon && <div data-testid="modal-icon">{icon}</div>}
                <div data-testid="modal-message">{message}</div>
            </div>
        );
    },
}));

// Mock ConfirmationAmountCard - capture the label prop for verification
vi.mock("@/components/wallet/ConfirmationAmountCard", () => ({
    default: ({
        label,
        amount,
        tokenSymbol,
        usdValue,
        variant,
        displayMode,
    }: {
        label: string;
        amount: number;
        tokenSymbol: string;
        usdValue?: number;
        variant: string;
        displayMode?: string;
    }) => (
        <div
            data-testid="confirmation-amount-card"
            data-label={label}
            data-amount={amount}
            data-variant={variant}
            data-display-mode={displayMode}
            data-usd-value={usdValue}
        >
            <span data-testid="card-label">{label}</span>
            <span data-testid="card-amount">
                {amount} {tokenSymbol}
            </span>
            <span data-testid="card-usd-value">{usdValue}</span>
        </div>
    ),
}));

// Mock LtvChangeIndicator
vi.mock("@/components/wallet/LtvChangeIndicator", () => ({
    default: ({
        currentLtv,
        newLtv,
        maxLtv,
    }: {
        currentLtv: number;
        newLtv: number;
        maxLtv?: number;
    }) => (
        <div data-testid="ltv-change-indicator">
            {currentLtv}% -> {newLtv}%{maxLtv && ` (max: ${maxLtv}%)`}
        </div>
    ),
}));

// Mock ProcessingState
vi.mock("@/components/wallet/ProcessingState", () => ({
    ProcessingState: ({ state, message }: { state: string; message?: string }) => (
        <div data-testid="processing-state" data-state={state}>
            {message || state}
        </div>
    ),
}));

// Mock TokenIcon
vi.mock("@/components/common/TokenIcon", () => ({
    default: ({ symbol }: { symbol: string }) => (
        <span data-testid={`token-icon-${symbol}`}>{symbol}</span>
    ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    CheckCircle: () => <span data-testid="check-circle-icon">check</span>,
    AlertTriangle: () => <span data-testid="alert-triangle-icon">warning</span>,
    ArrowRight: () => <span data-testid="arrow-right-icon">-></span>,
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
    cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(" "),
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

describe("Borrow Confirmation Modal - NET Amount Display", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Borrow Mode Label", () => {
        it("should display 'New Borrow Amount' label for borrow mode to indicate this is additional borrowing", () => {
            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="borrow"
                    collateralType="WBTC"
                    amount={1} // NET borrow amount: $1.00
                    tokenSymbol="USDT"
                    currentValue={13.91} // Existing debt
                    newValue={14.91} // New total debt
                    currentLtv={30}
                    newLtv={32}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            const card = screen.getByTestId("confirmation-amount-card");
            // The label should clearly indicate this is a "new" or "additional" borrow amount
            expect(card.getAttribute("data-label")).toBe("New Borrow Amount");
        });
    });

    describe("NET Borrow Amount Display", () => {
        it("should display the NET borrow amount ($1.00) as the primary amount, not the total debt", () => {
            const netBorrowAmount = 1; // User is borrowing $1.00 more
            const existingDebt = 13.91;
            const newTotalDebt = 14.91;

            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="borrow"
                    collateralType="WBTC"
                    amount={netBorrowAmount} // NET borrow amount
                    tokenSymbol="USDT"
                    currentValue={existingDebt}
                    newValue={newTotalDebt}
                    currentLtv={30}
                    newLtv={32}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            const card = screen.getByTestId("confirmation-amount-card");
            // The amount prop should be the NET borrow amount ($1.00), not the total debt
            expect(card.getAttribute("data-amount")).toBe(String(netBorrowAmount));
        });
    });

    describe("Value Change Section - Debt Progression", () => {
        it("should show existing debt -> new total debt in the Value Change section", () => {
            const netBorrowAmount = 1;
            const existingDebt = 13.91;
            const newTotalDebt = 14.91;

            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="borrow"
                    collateralType="WBTC"
                    amount={netBorrowAmount}
                    tokenSymbol="USDT"
                    currentValue={existingDebt}
                    newValue={newTotalDebt}
                    currentLtv={30}
                    newLtv={32}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            // Value Change section should show the debt progression
            // Look for the current value ($13.91)
            expect(screen.getByText(/\$13\.91/)).toBeInTheDocument();
            // Look for the new value ($14.91)
            expect(screen.getByText(/\$14\.91/)).toBeInTheDocument();
        });

        it("should label the Value Change section as 'Current Debt' for borrow mode", () => {
            const netBorrowAmount = 1;
            const existingDebt = 13.91;
            const newTotalDebt = 14.91;

            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="borrow"
                    collateralType="WBTC"
                    amount={netBorrowAmount}
                    tokenSymbol="USDT"
                    currentValue={existingDebt}
                    newValue={newTotalDebt}
                    currentLtv={30}
                    newLtv={32}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            // The label should be "Current Debt" to clarify this shows debt progression
            // (as opposed to the generic "Value Change" which is unclear for borrow mode)
            expect(screen.getByText("Current Debt")).toBeInTheDocument();
        });
    });

    describe("Comprehensive Example: $13.91 existing debt, $1.00 new borrow", () => {
        it("should correctly display all values for the specified example", () => {
            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="borrow"
                    collateralType="WBTC"
                    amount={1} // NET: $1.00
                    tokenSymbol="USDT"
                    currentValue={13.91} // Existing debt
                    newValue={14.91} // New total debt
                    currentLtv={30}
                    newLtv={32}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            // 1. Primary display should show "New Borrow Amount" label
            const card = screen.getByTestId("confirmation-amount-card");
            expect(card.getAttribute("data-label")).toBe("New Borrow Amount");

            // 2. Amount displayed should be the NET borrow ($1.00)
            expect(card.getAttribute("data-amount")).toBe("1");

            // 3. Value change section should show debt progression
            expect(screen.getByText(/\$13\.91/)).toBeInTheDocument(); // Current debt
            expect(screen.getByText(/\$14\.91/)).toBeInTheDocument(); // New total debt

            // 4. Label should be "Current Debt" for clarity
            expect(screen.getByText("Current Debt")).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("should handle first-time borrow (no existing debt) correctly", () => {
            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="borrow"
                    collateralType="WBTC"
                    amount={100} // First borrow: $100
                    tokenSymbol="USDT"
                    currentValue={0} // No existing debt
                    newValue={100} // New debt equals borrow amount
                    currentLtv={0}
                    newLtv={30}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card.getAttribute("data-label")).toBe("New Borrow Amount");
            expect(card.getAttribute("data-amount")).toBe("100");

            // Should show $0 -> $100 progression
            expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
        });

        it("should handle large borrow amounts correctly", () => {
            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="borrow"
                    collateralType="WBTC"
                    amount={5000} // Large borrow: $5,000
                    tokenSymbol="USDT"
                    currentValue={10000} // Existing debt: $10,000
                    newValue={15000} // New total: $15,000
                    currentLtv={30}
                    newLtv={45}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card.getAttribute("data-label")).toBe("New Borrow Amount");
            expect(card.getAttribute("data-amount")).toBe("5000");
        });
    });

    describe("Repay Mode Should Not Be Affected", () => {
        it("should keep 'Repay Amount' label for repay mode (unchanged)", () => {
            render(
                <LoanConfirmationModal
                    isOpen={true}
                    onClose={vi.fn()}
                    mode="repay"
                    collateralType="WBTC"
                    amount={5}
                    tokenSymbol="USDT"
                    currentValue={20}
                    newValue={15}
                    currentLtv={30}
                    newLtv={25}
                    maxLtv={80}
                    isProcessing={false}
                    isApproving={false}
                    needsApproval={false}
                    onConfirm={vi.fn()}
                    onApprove={vi.fn()}
                />
            );

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card.getAttribute("data-label")).toBe("Repay Amount");
        });
    });
});
