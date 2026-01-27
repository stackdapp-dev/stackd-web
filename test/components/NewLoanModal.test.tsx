/**
 * Unit tests for NewLoanModal component
 * Tests the existing position check and redirect behavior
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import NewLoanModal from "@/components/wallet/NewLoanModal";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock the custom toast
const mockShowInfoToast = vi.fn();
vi.mock("@/components/ui/custom-toast", () => ({
  showInfoToast: (msg: string) => mockShowInfoToast(msg),
}));

// Mock wallet balance context
vi.mock("@/hooks/useWalletBalanceContext", () => ({
  useWalletBalanceContext: () => ({
    assets: [],
    totalBalance: 0,
    isLoading: false,
    error: null,
    refetchBalances: vi.fn(),
    wbtcBalance: 1.5,
    usdtBalance: 0,
    chainBalances: { arbitrum: {}, ethereum: {} },
  }),
}));

// Mock XAUT balance
vi.mock("@/hooks/useXautBalance", () => ({
  useXautBalance: () => ({
    xautBalance: 2.0,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// Mock hooks for position data - use factory functions
const mockCompoundHook = vi.fn();
const mockFluidHook = vi.fn();

vi.mock("@/hooks/useCompound", () => ({
  useCompound: () => mockCompoundHook(),
}));

vi.mock("@/hooks/useFluid", () => ({
  useFluid: () => mockFluidHook(),
}));

// Mock the simulator modal to avoid provider issues
vi.mock("@/components/wallet/NewLoanSimulatorModal", () => ({
  default: ({ isOpen }: any) => isOpen ? <div data-testid="simulator-modal">Simulator Modal</div> : null,
}));

// Mock developer mode - default to false (XAUT visible)
vi.mock("@/providers/developerMode", () => ({
  useDeveloperMode: () => ({
    developerMode: false,
    setDeveloperMode: vi.fn(),
    toggle: vi.fn(),
  }),
}));

// Mock hasXautPosition - default to false
vi.mock("@/hooks/useHasXautPosition", () => ({
  useHasXautPosition: () => ({
    hasXautPosition: false,
    isLoading: false,
  }),
}));

describe("NewLoanModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default: no existing positions
    mockCompoundHook.mockReturnValue({
      collateralRaw: BigInt(0),
      borrowRaw: BigInt(0),
      isLoading: false,
    });
    mockFluidHook.mockReturnValue({
      hasPosition: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Existing Position Check", () => {
    it("should show info toast and redirect when user has existing WBTC position with collateral", async () => {
      // Set up: user has existing WBTC position (collateral > 0)
      mockCompoundHook.mockReturnValue({
        collateralRaw: BigInt(100000000), // 1 WBTC
        borrowRaw: BigInt(0),
        isLoading: false,
      });

      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);

      // Click dropdown to open it
      const dropdownTrigger = screen.getByText("Select collateral...");
      fireEvent.click(dropdownTrigger);

      // Select WBTC option
      const wbtcOption = screen.getByText("Bitcoin");
      fireEvent.click(wbtcOption);

      // Click Continue button
      const continueButton = screen.getByText("Continue");
      fireEvent.click(continueButton);

      // Verify info toast was shown with correct message
      expect(mockShowInfoToast).toHaveBeenCalledWith(
        "You already have an open loan position using this collateral type. Please use the Add Collateral, then Borrow functions instead. Redirecting now."
      );

      // Fast-forward timers to trigger redirect
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Verify redirect to loan page
      expect(mockPush).toHaveBeenCalledWith("/wallet/loan/wbtc");
    });

    it("should show info toast and redirect when user has existing WBTC position with debt", async () => {
      // Set up: user has existing WBTC position (borrow > 0)
      mockCompoundHook.mockReturnValue({
        collateralRaw: BigInt(0),
        borrowRaw: BigInt(1000000), // 1 USDT borrowed
        isLoading: false,
      });

      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);

      // Click dropdown and select WBTC
      const dropdownTrigger = screen.getByText("Select collateral...");
      fireEvent.click(dropdownTrigger);
      const wbtcOption = screen.getByText("Bitcoin");
      fireEvent.click(wbtcOption);

      // Click Continue
      const continueButton = screen.getByText("Continue");
      fireEvent.click(continueButton);

      // Verify toast
      expect(mockShowInfoToast).toHaveBeenCalledWith(
        expect.stringContaining("You already have an open loan position")
      );

      // Fast-forward and check redirect
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(mockPush).toHaveBeenCalledWith("/wallet/loan/wbtc");
    });

    it("should show info toast and redirect when user has existing XAUT position", async () => {
      // Set up: user has existing XAUT position
      mockFluidHook.mockReturnValue({
        hasPosition: true,
        isLoading: false,
      });

      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);

      // Click dropdown and select XAUT
      const dropdownTrigger = screen.getByText("Select collateral...");
      fireEvent.click(dropdownTrigger);
      const xautOption = screen.getByText("Gold");
      fireEvent.click(xautOption);

      // Click Continue
      const continueButton = screen.getByText("Continue");
      fireEvent.click(continueButton);

      // Verify toast
      expect(mockShowInfoToast).toHaveBeenCalledWith(
        expect.stringContaining("You already have an open loan position")
      );

      // Fast-forward and check redirect
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(mockPush).toHaveBeenCalledWith("/wallet/loan/xaut");
    });

    it("should proceed to simulator when user has no existing WBTC position", async () => {
      // Set up: no existing position (default mock values)
      mockCompoundHook.mockReturnValue({
        collateralRaw: BigInt(0),
        borrowRaw: BigInt(0),
        isLoading: false,
      });

      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);

      // Click dropdown and select WBTC
      const dropdownTrigger = screen.getByText("Select collateral...");
      fireEvent.click(dropdownTrigger);
      const wbtcOption = screen.getByText("Bitcoin");
      fireEvent.click(wbtcOption);

      // Click Continue
      const continueButton = screen.getByText("Continue");
      fireEvent.click(continueButton);

      // Should NOT show info toast about existing position
      expect(mockShowInfoToast).not.toHaveBeenCalledWith(
        expect.stringContaining("You already have an open loan position")
      );

      // Should NOT redirect to loan page
      expect(mockPush).not.toHaveBeenCalledWith("/wallet/loan/wbtc");

      // Should show the simulator modal
      expect(screen.getByTestId("simulator-modal")).toBeInTheDocument();
    });

    it("should proceed to simulator when user has no existing XAUT position", async () => {
      // Set up: no existing position
      mockFluidHook.mockReturnValue({
        hasPosition: false,
        isLoading: false,
      });

      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);

      // Click dropdown and select XAUT
      const dropdownTrigger = screen.getByText("Select collateral...");
      fireEvent.click(dropdownTrigger);
      const xautOption = screen.getByText("Gold");
      fireEvent.click(xautOption);

      // Click Continue
      const continueButton = screen.getByText("Continue");
      fireEvent.click(continueButton);

      // Should NOT show info toast about existing position
      expect(mockShowInfoToast).not.toHaveBeenCalledWith(
        expect.stringContaining("You already have an open loan position")
      );

      // Should NOT redirect
      expect(mockPush).not.toHaveBeenCalledWith("/wallet/loan/xaut");

      // Should show the simulator modal
      expect(screen.getByTestId("simulator-modal")).toBeInTheDocument();
    });

    it("should close modal after redirect when user has existing position", async () => {
      const mockOnClose = vi.fn();
      mockCompoundHook.mockReturnValue({
        collateralRaw: BigInt(100000000),
        borrowRaw: BigInt(0),
        isLoading: false,
      });

      render(<NewLoanModal isOpen={true} onClose={mockOnClose} />);

      // Click dropdown and select WBTC
      const dropdownTrigger = screen.getByText("Select collateral...");
      fireEvent.click(dropdownTrigger);
      const wbtcOption = screen.getByText("Bitcoin");
      fireEvent.click(wbtcOption);

      // Click Continue
      const continueButton = screen.getByText("Continue");
      fireEvent.click(continueButton);

      // Fast-forward timers
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Verify onClose was called
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Modal Rendering", () => {
    it("should render when isOpen is true", () => {
      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("New Loan Position")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(<NewLoanModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByText("New Loan Position")).not.toBeInTheDocument();
    });

    it("should disable Continue button when no collateral selected", () => {
      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);
      const continueButton = screen.getByText("Continue");
      expect(continueButton).toBeDisabled();
    });

    it("should enable Continue button when collateral is selected", () => {
      render(<NewLoanModal isOpen={true} onClose={vi.fn()} />);

      // Select a collateral type
      const dropdownTrigger = screen.getByText("Select collateral...");
      fireEvent.click(dropdownTrigger);
      const wbtcOption = screen.getByText("Bitcoin");
      fireEvent.click(wbtcOption);

      const continueButton = screen.getByText("Continue");
      expect(continueButton).not.toBeDisabled();
    });
  });
});
