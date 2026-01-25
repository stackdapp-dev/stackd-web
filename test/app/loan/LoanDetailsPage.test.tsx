/**
 * @vitest-environment jsdom
 */

/**
 * Tests for LoanDetailsPage Loading Skeleton
 *
 * The LoanDetailsPage component displays loan details for WBTC (Compound) and XAUT (Fluid).
 * This test suite verifies:
 * - Skeleton is shown when useCompound or useFluid isLoading is true
 * - Skeleton has data-testid="loan-loading-skeleton"
 * - Actual content is shown when loading is false
 * - Skeleton matches the layout structure (loan summary card, collateral section, action buttons, statistics)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
const mockNotFound = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    notFound: () => mockNotFound(),
    useRouter: () => ({
        push: mockPush,
        back: vi.fn(),
    }),
}));

// Mock useCompound hook
const mockUseCompound = vi.fn();
vi.mock("@/hooks/useCompound", () => ({
    useCompound: () => mockUseCompound(),
}));

// Mock useFluid hook
const mockUseFluid = vi.fn();
vi.mock("@/hooks/useFluid", () => ({
    useFluid: () => mockUseFluid(),
}));

// Mock useWalletBalanceContext
vi.mock("@/hooks/useWalletBalanceContext", () => ({
    useWalletBalanceContext: () => ({
        wbtcBalance: 0,
        refetchBalances: vi.fn(),
    }),
}));

// Mock useGetTokenPrice
vi.mock("@/providers/TokenPriceProvider", () => ({
    useGetTokenPrice: () => () => 100000,
}));

// Mock useVisibility
vi.mock("@/providers/visibility", () => ({
    useVisibility: () => ({
        visible: true,
        toggle: vi.fn(),
    }),
}));

// Mock useAutoLend
vi.mock("@/hooks/useAutoLend", () => ({
    useAutoLend: () => ({
        lendProcessing: false,
        startLend: vi.fn(),
    }),
}));

// Mock UI components
vi.mock("@/components/common/PageHeader", () => ({
    default: ({ title }: { title: string }) => <div data-testid="page-header">{title}</div>,
}));

vi.mock("@/components/common/TokenIcon", () => ({
    default: ({ symbol }: { symbol: string }) => <div data-testid={`token-icon-${symbol}`}>{symbol}</div>,
}));

vi.mock("@/components/ui/card", () => ({
    default: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock("@/components/ui/loading", () => ({
    Loading: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock("@/components/ui/maskedValue", () => ({
    default: ({ value }: { value: number }) => <span data-testid="masked-value">{value}</span>,
}));

vi.mock("@/components/ui/modal", () => ({
    default: ({ isOpen, children }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock("@/components/ui/text", () => ({
    default: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("@/components/wallet/LoanSimulator", () => ({
    default: () => <div data-testid="loan-simulator">Loan Simulator</div>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    Activity: () => <span data-testid="activity-icon">Activity</span>,
    AlertTriangle: () => <span data-testid="alert-icon">Alert</span>,
    DollarSign: () => <span data-testid="dollar-icon">Dollar</span>,
    TrendingDown: () => <span data-testid="trending-icon">Trending</span>,
    ArrowDownToLine: () => <span data-testid="arrow-down-icon">ArrowDown</span>,
    Plus: () => <span data-testid="plus-icon">Plus</span>,
    RotateCcw: () => <span data-testid="rotate-icon">Rotate</span>,
    ArrowUpFromLine: () => <span data-testid="arrow-up-icon">ArrowUp</span>,
    ExternalLink: () => <span data-testid="external-icon">External</span>,
}));

// Import the component after mocks
import LoanDetailsPage from "@/app/(main)/wallet/loan/[collateralType]/page";

// Default mock values for non-loading state
const defaultCompoundData = {
    suppliedAssets: [{ symbol: "WBTC", amount: 1.0, usdValue: 100000, decimals: 8 }],
    borrowedAssets: [{ symbol: "USDT", amount: 5000, usdValue: 5000, decimals: 6 }],
    maxLtv: 80,
    liquidationRatio: 85,
    borrowApr: 5.5,
    isLoading: false,
    refetch: vi.fn(),
};

const defaultFluidData = {
    suppliedAssets: [{ symbol: "XAUT", amount: 2.0, usdValue: 5400, decimals: 6 }],
    borrowedAssets: [{ symbol: "USDT", amount: 2000, usdValue: 2000, decimals: 6 }],
    maxLtv: 75,
    liquidationRatio: 80,
    borrowApr: 4.5,
    isLoading: false,
    nftId: BigInt(123),
    refetch: vi.fn(),
};

describe("LoanDetailsPage Loading Skeleton", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset to default non-loading state
        mockUseCompound.mockReturnValue({ ...defaultCompoundData });
        mockUseFluid.mockReturnValue({ ...defaultFluidData });
    });

    describe("WBTC/Compound Loan Loading State", () => {
        it("should show loading skeleton when useCompound isLoading is true", async () => {
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: true,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "wbtc" })} />);

            // Skeleton should be visible
            expect(screen.getByTestId("loan-loading-skeleton")).toBeInTheDocument();
        });

        it("should show actual loan content when useCompound isLoading is false", async () => {
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: false,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "wbtc" })} />);

            // Skeleton should NOT be visible
            expect(screen.queryByTestId("loan-loading-skeleton")).not.toBeInTheDocument();

            // Actual content should be visible
            expect(screen.getByText("Loan Details")).toBeInTheDocument();
            expect(screen.getByText("USDT Loan")).toBeInTheDocument();
        });
    });

    describe("XAUT/Fluid Loan Loading State", () => {
        it("should show loading skeleton when useFluid isLoading is true", async () => {
            mockUseFluid.mockReturnValue({
                ...defaultFluidData,
                isLoading: true,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "xaut" })} />);

            // Skeleton should be visible
            expect(screen.getByTestId("loan-loading-skeleton")).toBeInTheDocument();
        });

        it("should show actual loan content when useFluid isLoading is false", async () => {
            mockUseFluid.mockReturnValue({
                ...defaultFluidData,
                isLoading: false,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "xaut" })} />);

            // Skeleton should NOT be visible
            expect(screen.queryByTestId("loan-loading-skeleton")).not.toBeInTheDocument();

            // Actual content should be visible
            expect(screen.getByText("Loan Details")).toBeInTheDocument();
        });
    });

    describe("Skeleton Structure", () => {
        it("should render skeleton with proper layout structure for loan summary card", async () => {
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: true,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "wbtc" })} />);

            const skeleton = screen.getByTestId("loan-loading-skeleton");
            expect(skeleton).toBeInTheDocument();

            // Verify skeleton elements have skeleton-shimmer class
            const shimmerElements = skeleton.querySelectorAll(".skeleton-shimmer");
            expect(shimmerElements.length).toBeGreaterThan(0);
        });

        it("should include skeleton for collateral section", async () => {
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: true,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "wbtc" })} />);

            const skeleton = screen.getByTestId("loan-loading-skeleton");

            // Should have skeleton for collateral card area
            // Check for rounded-full elements (token icon placeholder)
            const roundedElements = skeleton.querySelectorAll(".rounded-full");
            expect(roundedElements.length).toBeGreaterThan(0);
        });

        it("should include skeleton for action buttons grid (2x2)", async () => {
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: true,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "wbtc" })} />);

            const skeleton = screen.getByTestId("loan-loading-skeleton");

            // Should have a 2-column grid for action buttons
            const gridElements = skeleton.querySelectorAll(".grid-cols-2");
            expect(gridElements.length).toBeGreaterThan(0);
        });

        it("should include skeleton for loan statistics grid (2x2)", async () => {
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: true,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "wbtc" })} />);

            const skeleton = screen.getByTestId("loan-loading-skeleton");

            // Should have statistics skeleton cards
            const cards = skeleton.querySelectorAll('[data-testid="card"]');
            expect(cards.length).toBeGreaterThanOrEqual(4); // At least 4 stat cards
        });
    });

    describe("Loading State Independence", () => {
        it("should only check the relevant hook for each collateral type (WBTC uses Compound)", async () => {
            // Even if Fluid is loading, WBTC page should check Compound
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: false,
            });
            mockUseFluid.mockReturnValue({
                ...defaultFluidData,
                isLoading: true,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "wbtc" })} />);

            // Should show content (not skeleton) because Compound is not loading
            expect(screen.queryByTestId("loan-loading-skeleton")).not.toBeInTheDocument();
            expect(screen.getByText("Loan Details")).toBeInTheDocument();
        });

        it("should only check the relevant hook for each collateral type (XAUT uses Fluid)", async () => {
            // Even if Compound is loading, XAUT page should check Fluid
            mockUseCompound.mockReturnValue({
                ...defaultCompoundData,
                isLoading: true,
            });
            mockUseFluid.mockReturnValue({
                ...defaultFluidData,
                isLoading: false,
            });

            render(<LoanDetailsPage params={Promise.resolve({ collateralType: "xaut" })} />);

            // Should show content (not skeleton) because Fluid is not loading
            expect(screen.queryByTestId("loan-loading-skeleton")).not.toBeInTheDocument();
            expect(screen.getByText("Loan Details")).toBeInTheDocument();
        });
    });
});
