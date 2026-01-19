/**
 * @vitest-environment jsdom
 */
/**
 * Tests for NewLoanModal Component
 *
 * Tests the modal behavior for creating new loan positions:
 * - Modal visibility based on isOpen prop
 * - Collateral selection dropdown (WBTC and XAUT options)
 * - Continue button disabled state when no selection
 * - Cancel button and backdrop click handlers
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewLoanModal from "@/components/wallet/NewLoanModal";

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({
        push: mockPush,
        prefetch: vi.fn(),
    })),
}));

// Mock useWalletBalanceContext
vi.mock("@/hooks/useWalletBalanceContext", () => ({
    useWalletBalanceContext: vi.fn(() => ({
        assets: [],
        totalBalance: 0,
        isLoading: false,
        error: null,
        refetchBalances: vi.fn(),
        wbtcBalance: 0,
        usdtBalance: 0,
    })),
}));

// Mock useXautBalance
vi.mock("@/hooks/useXautBalance", () => ({
    useXautBalance: vi.fn(() => ({
        xautBalance: 0,
        isLoading: false,
        error: null,
    })),
}));

// Mock showInfoToast
vi.mock("@/components/ui/custom-toast", () => ({
    showInfoToast: vi.fn(),
}));

describe("NewLoanModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    describe("Modal Visibility", () => {
        it("should render nothing when isOpen is false", () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={false} onClose={onClose} />);

            // Modal content should not be in the document
            expect(screen.queryByText("New Loan Position")).not.toBeInTheDocument();
            expect(screen.queryByText("Select collateral...")).not.toBeInTheDocument();
        });

        it("should render modal content when isOpen is true", () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            // Modal header should be visible
            expect(screen.getByText("New Loan Position")).toBeInTheDocument();
            // Subtitle should be visible
            expect(screen.getByText(/Select the collateral type/)).toBeInTheDocument();
            // Dropdown placeholder should be visible
            expect(screen.getByText("Select collateral...")).toBeInTheDocument();
            // Buttons should be visible
            expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /Continue/i })).toBeInTheDocument();
        });
    });

    describe("Continue Button State", () => {
        it("should have Continue button disabled when no collateral is selected", () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const continueButton = screen.getByRole("button", { name: /Continue/i });
            expect(continueButton).toBeDisabled();
        });

        it("should enable Continue button when WBTC is selected from dropdown", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();

            // Click the dropdown trigger
            const dropdownTrigger = screen.getByText("Select collateral...");
            await user.click(dropdownTrigger);

            // Click WBTC option (Bitcoin on Arbitrum)
            const wbtcOption = screen.getByText("Bitcoin");
            await user.click(wbtcOption);

            // Continue button should now be enabled
            const continueButton = screen.getByRole("button", { name: /Continue/i });
            expect(continueButton).not.toBeDisabled();
        });

        it("should enable Continue button when XAUT is selected from dropdown", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();

            // Click the dropdown trigger
            const dropdownTrigger = screen.getByText("Select collateral...");
            await user.click(dropdownTrigger);

            // Click XAUT option (Gold on Ethereum)
            const xautOption = screen.getByText("Gold");
            await user.click(xautOption);

            // Continue button should now be enabled
            const continueButton = screen.getByRole("button", { name: /Continue/i });
            expect(continueButton).not.toBeDisabled();
        });
    });

    describe("Cancel Button", () => {
        it("should call onClose when Cancel button is clicked", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();
            const cancelButton = screen.getByRole("button", { name: /Cancel/i });
            await user.click(cancelButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe("Backdrop Click", () => {
        it("should call onClose when clicking backdrop", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();

            // Find and click the backdrop (the div with bg-black/60 class)
            const backdrop = document.querySelector(".bg-black\\/60");
            expect(backdrop).toBeInTheDocument();

            if (backdrop) {
                await user.click(backdrop);
            }

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe("Dropdown Display", () => {
        it("should show WBTC option with Bitcoin name and Arbitrum network", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();

            // Open dropdown
            const dropdownTrigger = screen.getByText("Select collateral...");
            await user.click(dropdownTrigger);

            // Check WBTC option details
            expect(screen.getByText("Bitcoin")).toBeInTheDocument();
            expect(screen.getByText("WBTC")).toBeInTheDocument();
            expect(screen.getByText("Arbitrum")).toBeInTheDocument();
        });

        it("should show XAUT option with Gold name and Ethereum network", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();

            // Open dropdown
            const dropdownTrigger = screen.getByText("Select collateral...");
            await user.click(dropdownTrigger);

            // Check XAUT option details
            expect(screen.getByText("Gold")).toBeInTheDocument();
            expect(screen.getByText("XAUT")).toBeInTheDocument();
            expect(screen.getByText("Ethereum")).toBeInTheDocument();
        });

        it("should display selected collateral in dropdown trigger after selection", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();

            // Open dropdown and select WBTC
            const dropdownTrigger = screen.getByText("Select collateral...");
            await user.click(dropdownTrigger);
            await user.click(screen.getByText("Bitcoin"));

            // Dropdown trigger should now show selected item
            expect(screen.queryByText("Select collateral...")).not.toBeInTheDocument();
            expect(screen.getByText("Bitcoin")).toBeInTheDocument();
        });
    });

    describe("Close Button (X)", () => {
        it("should call onClose when X button is clicked", async () => {
            const onClose = vi.fn();
            render(<NewLoanModal isOpen={true} onClose={onClose} />);

            const user = userEvent.setup();

            // Find the X button (it's a button containing the X icon)
            const closeButtons = screen.getAllByRole("button");
            // The X button is the one in the header, not Cancel or Continue
            const xButton = closeButtons.find(
                (btn) =>
                    !btn.textContent?.includes("Cancel") &&
                    !btn.textContent?.includes("Continue") &&
                    !btn.textContent?.includes("Select")
            );

            expect(xButton).toBeInTheDocument();
            if (xButton) {
                await user.click(xButton);
            }

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
