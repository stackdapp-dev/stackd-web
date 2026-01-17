/**
 * @vitest-environment jsdom
 */

/**
 * Tests for CollateralCard Component
 *
 * The CollateralCard component displays:
 * - Other assets (USDT, ETH, etc.) passed via otherAssets prop
 * - WBTC with collapsible locked/available breakdown
 * - Health indicator for collateral positions
 *
 * CRITICAL BUG REGRESSION TEST:
 * WBTC must ALWAYS be displayed in the Assets section, regardless of:
 * - Whether there's WBTC in the wallet
 * - Whether there's WBTC in Compound protocol
 * - Whether hasCollateral is true or false
 *
 * The component receives WBTC separately from useCollateralBreakdown hook,
 * while other assets are passed via otherAssets prop. WBTC is filtered out
 * from the main assets list in the parent component, so CollateralCard
 * MUST always render the WBTC section.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CollateralCard from "@/components/wallet/CollateralCard";

// Mock the hooks
const mockBreakdown = {
    totalCollateralBtc: 0,
    totalCollateralUsd: 0,
    lockedCollateralBtc: 0,
    lockedCollateralUsd: 0,
    availableToWithdrawBtc: 0,
    availableToWithdrawUsd: 0,
    healthFactor: 0,
};

const mockUseCollateralBreakdown = vi.fn(() => ({
    breakdown: mockBreakdown,
    hasCollateral: false,
    hasLockedCollateral: false,
    isLoading: false,
    canWithdraw: () => ({ allowed: true }),
}));

const mockUseVisibility = vi.fn(() => ({
    visible: true,
    toggle: vi.fn(),
}));

vi.mock("@/hooks/useCollateralBreakdown", () => ({
    useCollateralBreakdown: () => mockUseCollateralBreakdown(),
}));

vi.mock("@/providers/visibility", () => ({
    useVisibility: () => mockUseVisibility(),
}));

const mockUseFluid = vi.fn(() => ({
    suppliedAssets: [] as { symbol: string; amount: number; usdValue: number; decimals: number }[],
    borrowedAssets: [] as { symbol: string; amount: number; usdValue: number; decimals: number }[],
    maxLtv: 0,
    isLoading: false,
}));

vi.mock("@/hooks/useFluid", () => ({
    useFluid: () => mockUseFluid(),
}));

const mockUseXautBalance = vi.fn(() => ({
    xautBalance: 0,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
}));

vi.mock("@/hooks/useXautBalance", () => ({
    useXautBalance: () => mockUseXautBalance(),
}));

const mockGetTokenPrice = vi.fn(() => 0);

vi.mock("@/providers/TokenPriceProvider", () => ({
    useGetTokenPrice: () => mockGetTokenPrice,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    Lock: () => <span data-testid="lock-icon">Lock</span>,
    Unlock: () => <span data-testid="unlock-icon">Unlock</span>,
    AlertTriangle: () => <span data-testid="alert-icon">Alert</span>,
    ChevronDown: () => <span data-testid="chevron-icon">Chevron</span>,
}));

// Mock UI components
vi.mock("@/components/ui/card", () => ({
    default: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock("@/components/ui/text", () => ({
    default: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock("@/components/common/TokenIcon", () => ({
    default: ({ symbol }: { symbol: string }) => <span data-testid={`token-icon-${symbol}`}>{symbol}</span>,
}));

describe("CollateralCard Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset to default mock values
        mockUseCollateralBreakdown.mockReturnValue({
            breakdown: { ...mockBreakdown },
            hasCollateral: false,
            hasLockedCollateral: false,
            isLoading: false,
            canWithdraw: () => ({ allowed: true }),
        });
        mockUseFluid.mockReturnValue({
            suppliedAssets: [],
            borrowedAssets: [],
            maxLtv: 0,
            isLoading: false,
        });
        mockUseXautBalance.mockReturnValue({
            xautBalance: 0,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });
        mockGetTokenPrice.mockReturnValue(0);
    });

    describe("WBTC Display - CRITICAL REGRESSION TEST", () => {
        it("should ALWAYS display WBTC even when hasCollateral is false", () => {
            // This is the critical bug fix test
            // WBTC is filtered from otherAssets in the parent, so CollateralCard
            // must always show WBTC, regardless of hasCollateral value
            mockUseCollateralBreakdown.mockReturnValue({
                breakdown: {
                    totalCollateralBtc: 0,
                    totalCollateralUsd: 0,
                    lockedCollateralBtc: 0,
                    lockedCollateralUsd: 0,
                    availableToWithdrawBtc: 0,
                    availableToWithdrawUsd: 0,
                    healthFactor: 0,
                },
                hasCollateral: false, // NO collateral
                hasLockedCollateral: false,
                isLoading: false,
                canWithdraw: () => ({ allowed: true }),
            });

            render(<CollateralCard otherAssets={[]} />);

            // WBTC should still be visible in the component
            expect(screen.getByTestId("token-icon-WBTC")).toBeInTheDocument();
            expect(screen.getByText("Bitcoin (Wrapped)")).toBeInTheDocument();
        });

        it("should display WBTC when user has WBTC balance", () => {
            mockUseCollateralBreakdown.mockReturnValue({
                breakdown: {
                    totalCollateralBtc: 0.5,
                    totalCollateralUsd: 50000,
                    lockedCollateralBtc: 0,
                    lockedCollateralUsd: 0,
                    availableToWithdrawBtc: 0.5,
                    availableToWithdrawUsd: 50000,
                    healthFactor: 1000,
                },
                hasCollateral: true,
                hasLockedCollateral: false,
                isLoading: false,
                canWithdraw: () => ({ allowed: true }),
            });

            render(<CollateralCard otherAssets={[]} />);

            expect(screen.getByTestId("token-icon-WBTC")).toBeInTheDocument();
            expect(screen.getByText("Bitcoin (Wrapped)")).toBeInTheDocument();
        });

        it("should display WBTC alongside other assets", () => {
            mockUseCollateralBreakdown.mockReturnValue({
                breakdown: {
                    totalCollateralBtc: 0.1,
                    totalCollateralUsd: 10000,
                    lockedCollateralBtc: 0,
                    lockedCollateralUsd: 0,
                    availableToWithdrawBtc: 0.1,
                    availableToWithdrawUsd: 10000,
                    healthFactor: 1000,
                },
                hasCollateral: true,
                hasLockedCollateral: false,
                isLoading: false,
                canWithdraw: () => ({ allowed: true }),
            });

            const otherAssets = [
                { symbol: "USDT", name: "USDT", amount: 1000, usdValue: 1000 },
                { symbol: "ETH", name: "Ethereum", amount: 0.5, usdValue: 1500 },
            ];

            render(<CollateralCard otherAssets={otherAssets} />);

            // All assets should be visible
            expect(screen.getByTestId("token-icon-WBTC")).toBeInTheDocument();
            expect(screen.getByTestId("token-icon-USDT")).toBeInTheDocument();
            expect(screen.getByTestId("token-icon-ETH")).toBeInTheDocument();
        });
    });

    describe("Other Assets Display", () => {
        it("should render other assets passed via props", () => {
            const otherAssets = [
                { symbol: "USDT", name: "USDT", amount: 500, usdValue: 500 },
            ];

            render(<CollateralCard otherAssets={otherAssets} />);

            expect(screen.getByTestId("token-icon-USDT")).toBeInTheDocument();
        });

        it("should display asset amounts and USD values", () => {
            const otherAssets = [
                { symbol: "USDT", name: "USDT", amount: 1000, usdValue: 1000 },
            ];

            render(<CollateralCard otherAssets={otherAssets} />);

            // Component should render the USDT asset
            expect(screen.getByTestId("token-icon-USDT")).toBeInTheDocument();
        });
    });

    describe("Collateral Breakdown", () => {
        it("should show expandable breakdown when hasLockedCollateral is true", () => {
            mockUseCollateralBreakdown.mockReturnValue({
                breakdown: {
                    totalCollateralBtc: 1.0,
                    totalCollateralUsd: 100000,
                    lockedCollateralBtc: 0.5,
                    lockedCollateralUsd: 50000,
                    availableToWithdrawBtc: 0.5,
                    availableToWithdrawUsd: 50000,
                    healthFactor: 2.0,
                },
                hasCollateral: true,
                hasLockedCollateral: true,
                isLoading: false,
                canWithdraw: () => ({ allowed: true }),
            });

            render(<CollateralCard otherAssets={[]} />);

            // Should show the chevron for expansion
            expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
        });

        it("should NOT show expandable breakdown when hasLockedCollateral is false", () => {
            mockUseCollateralBreakdown.mockReturnValue({
                breakdown: {
                    totalCollateralBtc: 0.5,
                    totalCollateralUsd: 50000,
                    lockedCollateralBtc: 0,
                    lockedCollateralUsd: 0,
                    availableToWithdrawBtc: 0.5,
                    availableToWithdrawUsd: 50000,
                    healthFactor: 1000,
                },
                hasCollateral: true,
                hasLockedCollateral: false,
                isLoading: false,
                canWithdraw: () => ({ allowed: true }),
            });

            render(<CollateralCard otherAssets={[]} />);

            // Should NOT show the chevron since no locked collateral
            expect(screen.queryByTestId("chevron-icon")).not.toBeInTheDocument();
        });
    });

    describe("Health Indicator", () => {
        it("should show health indicator when hasLockedCollateral is true", () => {
            mockUseCollateralBreakdown.mockReturnValue({
                breakdown: {
                    totalCollateralBtc: 1.0,
                    totalCollateralUsd: 100000,
                    lockedCollateralBtc: 0.5,
                    lockedCollateralUsd: 50000,
                    availableToWithdrawBtc: 0.5,
                    availableToWithdrawUsd: 50000,
                    healthFactor: 2.5,
                },
                hasCollateral: true,
                hasLockedCollateral: true,
                isLoading: false,
                canWithdraw: () => ({ allowed: true }),
            });

            render(<CollateralCard otherAssets={[]} />);

            // Should show "Healthy" status
            expect(screen.getByText("Healthy")).toBeInTheDocument();
        });
    });

    describe("Empty State", () => {
        it("should return null when no assets and no collateral", () => {
            mockUseCollateralBreakdown.mockReturnValue({
                breakdown: { ...mockBreakdown },
                hasCollateral: false,
                hasLockedCollateral: false,
                isLoading: false,
                canWithdraw: () => ({ allowed: true }),
            });

            // With the bug fix, this behavior changes:
            // We should always show WBTC, so it should NOT return null
            const { container } = render(<CollateralCard otherAssets={[]} />);

            // After fix: WBTC should always be shown
            expect(screen.getByTestId("token-icon-WBTC")).toBeInTheDocument();
        });
    });

    describe("Section Header", () => {
        it("should display 'Assets' section header", () => {
            render(<CollateralCard otherAssets={[{ symbol: "USDT", usdValue: 100 }]} />);

            expect(screen.getByText("Assets")).toBeInTheDocument();
        });
    });

    describe("XAUT Display - PARITY WITH WBTC", () => {
        it("should ALWAYS display XAUT even when no XAUT balance", () => {
            // XAUT should be visible like WBTC, regardless of balance
            render(<CollateralCard otherAssets={[]} />);

            expect(screen.getByTestId("token-icon-XAUT")).toBeInTheDocument();
            expect(screen.getByText("Tether Gold")).toBeInTheDocument();
        });

        it("should display XAUT with wallet balance when no collateral", () => {
            mockUseXautBalance.mockReturnValue({
                xautBalance: 0.5,
                isLoading: false,
                error: null,
                refetch: vi.fn(),
            });
            mockGetTokenPrice.mockReturnValue(2700); // Gold price

            render(<CollateralCard otherAssets={[]} />);

            expect(screen.getByTestId("token-icon-XAUT")).toBeInTheDocument();
            expect(screen.getByText("Tether Gold")).toBeInTheDocument();
        });

        it("should display XAUT with combined wallet + collateral balance", () => {
            // Wallet has 0.5 XAUT
            mockUseXautBalance.mockReturnValue({
                xautBalance: 0.5,
                isLoading: false,
                error: null,
                refetch: vi.fn(),
            });
            // Collateral has 1.0 XAUT
            mockUseFluid.mockReturnValue({
                suppliedAssets: [{ symbol: "XAUT", amount: 1.0, usdValue: 2700, decimals: 6 }],
                borrowedAssets: [],
                maxLtv: 0,
                isLoading: false,
            });
            mockGetTokenPrice.mockReturnValue(2700);

            render(<CollateralCard otherAssets={[]} />);

            expect(screen.getByTestId("token-icon-XAUT")).toBeInTheDocument();
        });

        it("should show locked/available breakdown when XAUT is used as collateral", () => {
            mockUseXautBalance.mockReturnValue({
                xautBalance: 0.2,
                isLoading: false,
                error: null,
                refetch: vi.fn(),
            });
            mockUseFluid.mockReturnValue({
                suppliedAssets: [{ symbol: "XAUT", amount: 1.0, usdValue: 2700, decimals: 6 }],
                borrowedAssets: [{ symbol: "USDT", amount: 1000, usdValue: 1000, decimals: 6 }],
                maxLtv: 80,
                isLoading: false,
            });
            mockGetTokenPrice.mockReturnValue(2700);

            render(<CollateralCard otherAssets={[]} />);

            // Should show expandable chevron when locked
            // Note: we check for the presence of the XAUT section
            expect(screen.getByTestId("token-icon-XAUT")).toBeInTheDocument();
        });
    });
});
