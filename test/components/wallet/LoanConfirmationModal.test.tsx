/**
 * @vitest-environment jsdom
 */

/**
 * Tests for LoanConfirmationModal Component
 *
 * The LoanConfirmationModal component is a comprehensive modal for confirming loan operations.
 * It supports four modes: addCollateral, withdrawCollateral, borrow, and repay.
 *
 * Key Features:
 * - Mode-specific title and variant styling
 * - LTV change indicator in header (when LTV props provided)
 * - ProcessingState when isProcessing or isApproving
 * - Warning/success icons based on risk direction
 * - Approve & Continue button when needsApproval
 * - Cancel button that calls onClose
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoanConfirmationModal from "@/components/wallet/LoanConfirmationModal";

// Mock Modal component - includes close button to test close behavior
vi.mock("@/components/ui/modal", () => ({
    default: ({
        isOpen,
        onClose,
        title,
        message,
        icon,
    }: {
        isOpen: boolean;
        onClose: () => void;
        title: string;
        message: React.ReactNode;
        icon?: React.ReactNode;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal">
                <button
                    data-testid="modal-close-button"
                    aria-label="Close"
                    onClick={onClose}
                >
                    X
                </button>
                <div data-testid="modal-title">{title}</div>
                {icon && <div data-testid="modal-icon">{icon}</div>}
                <div data-testid="modal-message">{message}</div>
            </div>
        );
    },
}));

// Mock ConfirmationAmountCard
vi.mock("@/components/wallet/ConfirmationAmountCard", () => ({
    default: ({
        label,
        amount,
        tokenSymbol,
        variant,
        displayMode,
    }: {
        label: string;
        amount: number;
        tokenSymbol: string;
        variant: string;
        displayMode?: string;
    }) => (
        <div
            data-testid="confirmation-amount-card"
            data-variant={variant}
            data-display-mode={displayMode}
        >
            <span>{label}</span>
            <span>
                {amount} {tokenSymbol}
            </span>
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
            {currentLtv}% → {newLtv}%{maxLtv && ` (max: ${maxLtv}%)`}
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
    CheckCircle: () => <span data-testid="check-circle-icon">✓</span>,
    AlertTriangle: () => <span data-testid="alert-triangle-icon">⚠</span>,
    ArrowRight: () => <span data-testid="arrow-right-icon">→</span>,
    XCircle: () => <span data-testid="x-circle-icon">✕</span>,
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

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    mode: "addCollateral" as const,
    collateralType: "WBTC" as const,
    amount: 0.5,
    tokenSymbol: "WBTC",
    currentValue: 1000,
    newValue: 1500,
    isProcessing: false,
    isApproving: false,
    needsApproval: false,
    onConfirm: vi.fn(),
    onApprove: vi.fn(),
};

describe("LoanConfirmationModal Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Modal Visibility", () => {
        it("should not render when isOpen is false", () => {
            render(<LoanConfirmationModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
        });

        it("should render when isOpen is true", () => {
            render(<LoanConfirmationModal {...defaultProps} />);

            expect(screen.getByTestId("modal")).toBeInTheDocument();
        });
    });

    describe("Mode-Specific Titles", () => {
        it("should render correct title for addCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="addCollateral" />);

            expect(screen.getByTestId("modal-title")).toHaveTextContent(
                "Confirm Add Collateral"
            );
        });

        it("should render correct title for withdrawCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="withdrawCollateral" />);

            expect(screen.getByTestId("modal-title")).toHaveTextContent(
                "Confirm Withdraw Collateral"
            );
        });

        it("should render correct title for borrow mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="borrow" />);

            expect(screen.getByTestId("modal-title")).toHaveTextContent("Confirm Borrow");
        });

        it("should render correct title for repay mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="repay" />);

            expect(screen.getByTestId("modal-title")).toHaveTextContent(
                "Confirm Repay Loan"
            );
        });
    });

    describe("ConfirmationAmountCard Variant", () => {
        it("should use success variant for addCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="addCollateral" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-variant", "success");
        });

        it("should use warning variant for withdrawCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="withdrawCollateral" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-variant", "warning");
        });

        it("should use warning variant for borrow mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="borrow" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-variant", "warning");
        });

        it("should use success variant for repay mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="repay" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-variant", "success");
        });
    });

    describe("ConfirmationAmountCard Display Mode", () => {
        it("should use both display mode for addCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="addCollateral" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-display-mode", "both");
        });

        it("should use both display mode for withdrawCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="withdrawCollateral" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-display-mode", "both");
        });

        it("should use usd display mode for borrow mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="borrow" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-display-mode", "usd");
        });

        it("should use usd display mode for repay mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="repay" />);

            const card = screen.getByTestId("confirmation-amount-card");
            expect(card).toHaveAttribute("data-display-mode", "usd");
        });
    });

    describe("LTV Change Indicator", () => {
        it("should show LTV change indicator in header when LTV props provided", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    currentLtv={30}
                    newLtv={25}
                    maxLtv={80}
                />
            );

            expect(screen.getByTestId("ltv-change-indicator")).toBeInTheDocument();
            expect(screen.getByTestId("ltv-change-indicator")).toHaveTextContent(
                "30% → 25%"
            );
        });

        it("should not show LTV change indicator when LTV props not provided", () => {
            render(<LoanConfirmationModal {...defaultProps} />);

            expect(screen.queryByTestId("ltv-change-indicator")).not.toBeInTheDocument();
        });

        it("should display Loan-to-Value label next to LTV indicator", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    currentLtv={30}
                    newLtv={45}
                />
            );

            expect(screen.getByText("Loan-to-Value")).toBeInTheDocument();
        });
    });

    describe("Processing State", () => {
        it("should show ProcessingState when isProcessing is true", () => {
            render(<LoanConfirmationModal {...defaultProps} isProcessing={true} />);

            expect(screen.getByTestId("processing-state")).toBeInTheDocument();
            expect(screen.getByTestId("processing-state")).toHaveAttribute(
                "data-state",
                "processing"
            );
        });

        it("should show ProcessingState when isApproving is true", () => {
            render(<LoanConfirmationModal {...defaultProps} isApproving={true} />);

            expect(screen.getByTestId("processing-state")).toBeInTheDocument();
            expect(screen.getByTestId("processing-state")).toHaveAttribute(
                "data-state",
                "approving"
            );
        });

        it("should hide ConfirmationAmountCard when processing", () => {
            render(<LoanConfirmationModal {...defaultProps} isProcessing={true} />);

            expect(
                screen.queryByTestId("confirmation-amount-card")
            ).not.toBeInTheDocument();
        });

        it("should hide buttons when processing", () => {
            render(<LoanConfirmationModal {...defaultProps} isProcessing={true} />);

            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Add Collateral")).not.toBeInTheDocument();
        });
    });

    describe("Warning and Success Icons", () => {
        it("should show success (CheckCircle) icon for addCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="addCollateral" />);

            expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
            expect(screen.queryByTestId("alert-triangle-icon")).not.toBeInTheDocument();
        });

        it("should show warning (AlertTriangle) icon for withdrawCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="withdrawCollateral" />);

            expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
            expect(screen.queryByTestId("check-circle-icon")).not.toBeInTheDocument();
        });

        it("should show warning (AlertTriangle) icon for borrow mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="borrow" />);

            expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
            expect(screen.queryByTestId("check-circle-icon")).not.toBeInTheDocument();
        });

        it("should show success (CheckCircle) icon for repay mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="repay" />);

            expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
            expect(screen.queryByTestId("alert-triangle-icon")).not.toBeInTheDocument();
        });
    });

    describe("Primary Button - Approval Required", () => {
        it("should show 'Approve & Continue' when needsApproval is true", () => {
            render(
                <LoanConfirmationModal {...defaultProps} needsApproval={true} />
            );

            expect(screen.getByText("Approve & Continue")).toBeInTheDocument();
        });

        it("should call onApprove when needsApproval is true and button is clicked", () => {
            const onApprove = vi.fn();
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    needsApproval={true}
                    onApprove={onApprove}
                />
            );

            fireEvent.click(screen.getByText("Approve & Continue"));
            expect(onApprove).toHaveBeenCalledTimes(1);
        });
    });

    describe("Primary Button - Mode-Specific Text", () => {
        it("should show 'Add Collateral' for addCollateral mode when no approval needed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="addCollateral"
                    needsApproval={false}
                />
            );

            expect(screen.getByText("Add Collateral")).toBeInTheDocument();
        });

        it("should show 'Withdraw Collateral' for withdrawCollateral mode when no approval needed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="withdrawCollateral"
                    needsApproval={false}
                />
            );

            expect(screen.getByText("Withdraw Collateral")).toBeInTheDocument();
        });

        it("should show 'Borrow' for borrow mode when no approval needed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="borrow"
                    needsApproval={false}
                />
            );

            expect(screen.getByText("Borrow")).toBeInTheDocument();
        });

        it("should show 'Repay Loan' for repay mode when no approval needed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="repay"
                    needsApproval={false}
                />
            );

            expect(screen.getByText("Repay Loan")).toBeInTheDocument();
        });

        it("should call onConfirm when primary button is clicked and no approval needed", () => {
            const onConfirm = vi.fn();
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    needsApproval={false}
                    onConfirm={onConfirm}
                />
            );

            fireEvent.click(screen.getByText("Add Collateral"));
            expect(onConfirm).toHaveBeenCalledTimes(1);
        });
    });

    describe("Cancel Button", () => {
        it("should render Cancel button", () => {
            render(<LoanConfirmationModal {...defaultProps} />);

            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("should call onClose when Cancel button is clicked", () => {
            const onClose = vi.fn();
            render(<LoanConfirmationModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("Cancel"));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it("should have secondary button styling (bg-white/10)", () => {
            render(<LoanConfirmationModal {...defaultProps} />);

            const cancelButton = screen.getByText("Cancel");
            expect(cancelButton).toHaveClass("bg-white/10");
        });
    });

    describe("Primary Button Styling", () => {
        it("should have gradient styling for primary button", () => {
            render(<LoanConfirmationModal {...defaultProps} />);

            const primaryButton = screen.getByText("Add Collateral");
            expect(primaryButton).toHaveClass("bg-gradient-to-br");
            expect(primaryButton).toHaveClass("from-[#ffa02d]");
            expect(primaryButton).toHaveClass("to-[#ff8c00]");
        });

        it("should have hover glow effect on primary button", () => {
            render(<LoanConfirmationModal {...defaultProps} />);

            const primaryButton = screen.getByText("Add Collateral");
            expect(primaryButton).toHaveClass(
                "hover:shadow-[0_0_20px_rgba(255,160,45,0.5)]"
            );
        });
    });

    describe("Warning/Success Banner Text", () => {
        it("should display default warning text for addCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="addCollateral" />);

            expect(
                screen.getByText(
                    "This will increase your collateral and reduce liquidation risk."
                )
            ).toBeInTheDocument();
        });

        it("should display default warning text for withdrawCollateral mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="withdrawCollateral" />);

            expect(
                screen.getByText(
                    "This will reduce your collateral and increase liquidation risk."
                )
            ).toBeInTheDocument();
        });

        it("should display default warning text for borrow mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="borrow" />);

            expect(
                screen.getByText(
                    "This will increase your LTV and the risk of liquidation."
                )
            ).toBeInTheDocument();
        });

        it("should display default warning text for repay mode", () => {
            render(<LoanConfirmationModal {...defaultProps} mode="repay" />);

            expect(
                screen.getByText(
                    "This will reduce your borrowed amount and liquidation risk."
                )
            ).toBeInTheDocument();
        });

        it("should display custom warning text when warningText prop is provided", () => {
            const customWarning = "Custom warning message";
            render(
                <LoanConfirmationModal {...defaultProps} warningText={customWarning} />
            );

            expect(screen.getByText(customWarning)).toBeInTheDocument();
        });
    });

    describe("Token Icon", () => {
        it("should display token icon for WBTC", () => {
            render(
                <LoanConfirmationModal {...defaultProps} tokenSymbol="WBTC" />
            );

            expect(screen.getByTestId("token-icon-WBTC")).toBeInTheDocument();
        });

        it("should display token icon for XAUT", () => {
            render(
                <LoanConfirmationModal {...defaultProps} tokenSymbol="XAUT" />
            );

            expect(screen.getByTestId("token-icon-XAUT")).toBeInTheDocument();
        });
    });

    describe("Summary Section", () => {
        it("should display current value in summary", () => {
            render(
                <LoanConfirmationModal {...defaultProps} currentValue={1000} newValue={1500} />
            );

            expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
        });

        it("should display new value in summary", () => {
            render(
                <LoanConfirmationModal {...defaultProps} currentValue={1000} newValue={1500} />
            );

            expect(screen.getByText(/\$1,500\.00/)).toBeInTheDocument();
        });
    });

    describe("USD Calculation for Collateral Operations", () => {
        /**
         * BUG FIX TEST: For collateral operations (withdrawCollateral, addCollateral),
         * the modal should display USD values calculated from tokenAmount * tokenPrice,
         * not just the raw token amounts.
         *
         * Previously, currentValue and newValue were passed as token amounts
         * (e.g., 0.0047 XAUT) which displayed as "$0.00" instead of the actual
         * USD value (~$23.50 at $5000/oz).
         *
         * The fix: LoanConfirmationModal now accepts a tokenPrice prop for collateral modes.
         * When provided, it multiplies currentValue and newValue by tokenPrice to get USD values.
         */

        it("should display correct USD value for WBTC withdrawal (tokenPrice prop)", () => {
            // Given: Withdrawing 0.01 WBTC at $100,000/BTC
            // Current collateral: 0.05 WBTC (should display as $5,000)
            // New collateral after withdrawal: 0.04 WBTC (should display as $4,000)
            const tokenPrice = 100000; // $100,000 per WBTC
            const currentCollateral = 0.05; // 0.05 WBTC (token amount)
            const newCollateral = 0.04; // 0.04 WBTC (token amount)

            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="withdrawCollateral"
                    collateralType="WBTC"
                    tokenSymbol="WBTC"
                    amount={0.01}
                    tokenPrice={tokenPrice}
                    currentValue={currentCollateral} // 0.05 WBTC (token amount)
                    newValue={newCollateral} // 0.04 WBTC (token amount)
                />
            );

            // Modal calculates USD internally: 0.05 * 100000 = $5,000, 0.04 * 100000 = $4,000
            expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$4,000\.00/)).toBeInTheDocument();
        });

        it("should display correct USD value for XAUT withdrawal (tokenPrice prop)", () => {
            // Given: Withdrawing 0.0047 XAUT at $5,000/oz
            // Current collateral: 0.01 XAUT (should display as $50)
            // New collateral after withdrawal: 0.0053 XAUT (should display as $26.50)
            const tokenPrice = 5000; // $5,000 per oz
            const currentCollateral = 0.01; // 0.01 XAUT (token amount)
            const newCollateral = 0.0053; // 0.0053 XAUT (token amount)

            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="withdrawCollateral"
                    collateralType="XAUT"
                    tokenSymbol="XAUT"
                    amount={0.0047}
                    tokenPrice={tokenPrice}
                    currentValue={currentCollateral} // 0.01 XAUT (token amount)
                    newValue={newCollateral} // 0.0053 XAUT (token amount)
                />
            );

            // Modal calculates USD internally: 0.01 * 5000 = $50, 0.0053 * 5000 = $26.50
            expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$26\.50/)).toBeInTheDocument();
        });

        it("should display correct USD value for WBTC addCollateral (tokenPrice prop)", () => {
            // Given: Adding 0.02 WBTC at $100,000/BTC
            // Current collateral: 0.03 WBTC (should display as $3,000)
            // New collateral after adding: 0.05 WBTC (should display as $5,000)
            const tokenPrice = 100000;
            const currentCollateral = 0.03; // token amount
            const newCollateral = 0.05; // token amount

            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="addCollateral"
                    collateralType="WBTC"
                    tokenSymbol="WBTC"
                    amount={0.02}
                    tokenPrice={tokenPrice}
                    currentValue={currentCollateral} // 0.03 WBTC (token amount)
                    newValue={newCollateral} // 0.05 WBTC (token amount)
                />
            );

            // Modal calculates USD internally: 0.03 * 100000 = $3,000, 0.05 * 100000 = $5,000
            expect(screen.getByText(/\$3,000\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
        });

        it("should display correct USD value for XAUT addCollateral (tokenPrice prop)", () => {
            // Given: Adding 0.01 XAUT at $5,000/oz
            // Current collateral: 0.005 XAUT (should display as $25)
            // New collateral after adding: 0.015 XAUT (should display as $75)
            const tokenPrice = 5000;
            const currentCollateral = 0.005; // token amount
            const newCollateral = 0.015; // token amount

            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="addCollateral"
                    collateralType="XAUT"
                    tokenSymbol="XAUT"
                    amount={0.01}
                    tokenPrice={tokenPrice}
                    currentValue={currentCollateral} // 0.005 XAUT (token amount)
                    newValue={newCollateral} // 0.015 XAUT (token amount)
                />
            );

            // Modal calculates USD internally: 0.005 * 5000 = $25, 0.015 * 5000 = $75
            expect(screen.getByText(/\$25\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();
        });

        it("should handle borrow mode without tokenPrice (values already in USD)", () => {
            // For borrow mode, currentValue and newValue are already in USD
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="borrow"
                    tokenSymbol="USDT"
                    amount={500}
                    currentValue={1000} // $1,000 current debt (already in USD)
                    newValue={1500} // $1,500 new debt (already in USD)
                />
            );

            // Should display USD values correctly (no conversion needed)
            expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$1,500\.00/)).toBeInTheDocument();
        });

        it("should handle repay mode without tokenPrice (values already in USD)", () => {
            // For repay mode, currentValue and newValue are already in USD
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="repay"
                    tokenSymbol="USDT"
                    amount={200}
                    currentValue={1000} // $1,000 current debt (already in USD)
                    newValue={800} // $800 new debt after repayment (already in USD)
                />
            );

            // Should display USD values correctly (no conversion needed)
            expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$800\.00/)).toBeInTheDocument();
        });

        it("should fallback to raw values when tokenPrice is not provided for collateral mode", () => {
            // This tests backward compatibility: if tokenPrice is not passed,
            // currentValue and newValue are displayed as-is
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    mode="withdrawCollateral"
                    collateralType="WBTC"
                    tokenSymbol="WBTC"
                    amount={0.01}
                    // tokenPrice NOT provided
                    currentValue={5000} // Pre-calculated USD value
                    newValue={4000} // Pre-calculated USD value
                />
            );

            // Should display the values as-is
            expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
            expect(screen.getByText(/\$4,000\.00/)).toBeInTheDocument();
        });
    });

    describe("Close Button During Processing States", () => {
        it("should always render close button (X) even during processing state", () => {
            render(<LoanConfirmationModal {...defaultProps} isProcessing={true} />);

            const closeButton = screen.getByTestId("modal-close-button");
            expect(closeButton).toBeInTheDocument();
        });

        it("should always render close button (X) even during approving state", () => {
            render(<LoanConfirmationModal {...defaultProps} isApproving={true} />);

            const closeButton = screen.getByTestId("modal-close-button");
            expect(closeButton).toBeInTheDocument();
        });

        it("should call onClose when close button is clicked during processing state", () => {
            const onClose = vi.fn();
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    isProcessing={true}
                    onClose={onClose}
                />
            );

            const closeButton = screen.getByTestId("modal-close-button");
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it("should call onClose when close button is clicked during approving state", () => {
            const onClose = vi.fn();
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    isApproving={true}
                    onClose={onClose}
                />
            );

            const closeButton = screen.getByTestId("modal-close-button");
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it("should call onClose when close button is clicked during both processing and approving state", () => {
            const onClose = vi.fn();
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    isProcessing={true}
                    isApproving={true}
                    onClose={onClose}
                />
            );

            const closeButton = screen.getByTestId("modal-close-button");
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe("Error State", () => {
        it("should display error message when error prop is provided", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed: insufficient funds"
                />
            );

            expect(screen.getByText("Transaction failed: insufficient funds")).toBeInTheDocument();
        });

        it("should show error banner with red/error styling when error is displayed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed"
                />
            );

            const errorBanner = screen.getByTestId("error-banner");
            expect(errorBanner).toBeInTheDocument();
            expect(errorBanner).toHaveClass("bg-red-500/10");
            expect(errorBanner).toHaveClass("border-red-500/20");
        });

        it("should display XCircle (error) icon in error state", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed"
                />
            );

            expect(screen.getByTestId("x-circle-icon")).toBeInTheDocument();
        });

        it("should show 'Try Again' button when error is displayed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed"
                />
            );

            expect(screen.getByText("Try Again")).toBeInTheDocument();
        });

        it("should call onRetry when 'Try Again' button is clicked", () => {
            const onRetry = vi.fn();
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed"
                    onRetry={onRetry}
                />
            );

            fireEvent.click(screen.getByText("Try Again"));
            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it("should still show Cancel button when error is displayed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed"
                />
            );

            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("should call onClose when Cancel button is clicked in error state", () => {
            const onClose = vi.fn();
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed"
                    onClose={onClose}
                />
            );

            fireEvent.click(screen.getByText("Cancel"));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it("should hide ConfirmationAmountCard when error is displayed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error="Transaction failed"
                />
            );

            expect(screen.queryByTestId("confirmation-amount-card")).not.toBeInTheDocument();
        });

        it("should hide LTV indicator when error is displayed", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    currentLtv={30}
                    newLtv={45}
                    error="Transaction failed"
                />
            );

            expect(screen.queryByTestId("ltv-change-indicator")).not.toBeInTheDocument();
        });

        it("should not show error when error prop is null", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error={null}
                />
            );

            expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
            expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
        });

        it("should not show error when error prop is empty string", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    error=""
                />
            );

            expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
        });

        it("should prioritize processing state over error state", () => {
            render(
                <LoanConfirmationModal
                    {...defaultProps}
                    isProcessing={true}
                    error="Transaction failed"
                />
            );

            // Should show processing, not error
            expect(screen.getByTestId("processing-state")).toBeInTheDocument();
            expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
        });
    });
});
