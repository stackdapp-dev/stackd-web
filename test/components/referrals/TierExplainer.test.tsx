/**
 * @vitest-environment jsdom
 */
/**
 * Unit tests for TierExplainer page component
 * TDD: Write tests FIRST, then implement
 *
 * Tests the main tier explainer page that shows all 5 tiers,
 * current user tier, requirements, benefits, and progress.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import type { UserTier } from "@/lib/referrals/tiers";

// Mock the useReferral hook
vi.mock("@/hooks/useReferral", () => ({
    useReferral: vi.fn(),
}));

// Import after mocking
import { useReferral } from "@/hooks/useReferral";
import { TierExplainer } from "@/components/referrals/TierExplainer";

const mockUseReferral = useReferral as ReturnType<typeof vi.fn>;

// Test data factory
const createMockStats = (overrides: {
    tier?: UserTier;
    network_volume?: number;
    next_tier_progress?: number;
    next_tier_remaining?: string;
} = {}) => ({
    tier: overrides.tier ?? "SILVER",
    total_earnings: 125.50,
    total_invites: 5,
    network_volume: overrides.network_volume ?? 3500,
    network_size: 12,
    inflation_avoided: 1250.00,
    interest_saved: 850.00,
    next_tier_progress: overrides.next_tier_progress ?? 70,
    next_tier_remaining: overrides.next_tier_remaining ?? "$1,500 to Gold",
    recent_invites: [],
});

describe("TierExplainer Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseReferral.mockReturnValue({
            stats: createMockStats(),
            referralCode: "ABC123",
            loading: false,
            createCode: vi.fn(),
        });
    });

    describe("Page Header", () => {
        it("should render page header 'Tier Benefits'", () => {
            render(<TierExplainer />);
            expect(screen.getByRole("heading", { name: /tier benefits/i })).toBeInTheDocument();
        });

        it("should render subtitle explaining the tier system", () => {
            render(<TierExplainer />);
            expect(screen.getByText(/unlock rewards as you grow your network/i)).toBeInTheDocument();
        });
    });

    describe("Current User Tier Display", () => {
        it("should display current user tier prominently", () => {
            render(<TierExplainer />);
            // Should show the current tier name prominently
            expect(screen.getByTestId("current-tier-display")).toBeInTheDocument();
            expect(screen.getByText(/silver/i)).toBeInTheDocument();
        });

        it("should display BRONZE tier when user is Bronze", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({ tier: "BRONZE" }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);
            expect(screen.getByTestId("current-tier-display")).toHaveTextContent(/bronze/i);
        });

        it("should display GOLD tier when user is Gold", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({ tier: "GOLD", network_volume: 6000 }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);
            expect(screen.getByTestId("current-tier-display")).toHaveTextContent(/gold/i);
        });

        it("should display PLATINUM tier when user is Platinum", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({ tier: "PLATINUM", network_volume: 15000 }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);
            expect(screen.getByTestId("current-tier-display")).toHaveTextContent(/platinum/i);
        });

        it("should display BLACK tier when user is Black", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({ tier: "BLACK", network_volume: 60000 }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);
            expect(screen.getByTestId("current-tier-display")).toHaveTextContent(/black/i);
        });
    });

    describe("Tier Cards Rendering", () => {
        it("should render all 5 tier cards (Bronze, Silver, Gold, Platinum, Black)", () => {
            render(<TierExplainer />);

            const tierCards = screen.getAllByTestId(/^tier-card-/);
            expect(tierCards).toHaveLength(5);

            // Verify each tier card exists
            expect(screen.getByTestId("tier-card-BRONZE")).toBeInTheDocument();
            expect(screen.getByTestId("tier-card-SILVER")).toBeInTheDocument();
            expect(screen.getByTestId("tier-card-GOLD")).toBeInTheDocument();
            expect(screen.getByTestId("tier-card-PLATINUM")).toBeInTheDocument();
            expect(screen.getByTestId("tier-card-BLACK")).toBeInTheDocument();
        });

        it("should render tier names correctly", () => {
            render(<TierExplainer />);

            expect(screen.getByText("Bronze")).toBeInTheDocument();
            expect(screen.getByText("Silver")).toBeInTheDocument();
            expect(screen.getByText("Gold")).toBeInTheDocument();
            expect(screen.getByText("Platinum")).toBeInTheDocument();
            expect(screen.getByText("Black")).toBeInTheDocument();
        });
    });

    describe("Tier Requirements Display", () => {
        it("should show requirements for Bronze tier (starting tier)", () => {
            render(<TierExplainer />);
            const bronzeCard = screen.getByTestId("tier-card-BRONZE");
            expect(within(bronzeCard).getByText(/starting tier/i)).toBeInTheDocument();
        });

        it("should show requirements for Silver tier (personal loan >= $500)", () => {
            render(<TierExplainer />);
            const silverCard = screen.getByTestId("tier-card-SILVER");
            expect(within(silverCard).getByText(/\$500/i)).toBeInTheDocument();
        });

        it("should show requirements for Gold tier (network volume >= $5,000)", () => {
            render(<TierExplainer />);
            const goldCard = screen.getByTestId("tier-card-GOLD");
            expect(within(goldCard).getByText(/\$5,000/i)).toBeInTheDocument();
        });

        it("should show requirements for Platinum tier (network volume >= $10,000)", () => {
            render(<TierExplainer />);
            const platinumCard = screen.getByTestId("tier-card-PLATINUM");
            expect(within(platinumCard).getByText(/\$10,000/i)).toBeInTheDocument();
        });

        it("should show requirements for Black tier (network volume >= $50,000)", () => {
            render(<TierExplainer />);
            const blackCard = screen.getByTestId("tier-card-BLACK");
            expect(within(blackCard).getByText(/\$50,000/i)).toBeInTheDocument();
        });
    });

    describe("Tier Benefits Display", () => {
        it("should show benefits for Bronze tier", () => {
            render(<TierExplainer />);
            const bronzeCard = screen.getByTestId("tier-card-BRONZE");
            expect(within(bronzeCard).getByText(/earnings locked/i)).toBeInTheDocument();
        });

        it("should show benefits for Silver tier (payouts unlocked)", () => {
            render(<TierExplainer />);
            const silverCard = screen.getByTestId("tier-card-SILVER");
            expect(within(silverCard).getByText(/payouts unlocked/i)).toBeInTheDocument();
        });

        it("should show benefits for Gold tier (+5% APY boost)", () => {
            render(<TierExplainer />);
            const goldCard = screen.getByTestId("tier-card-GOLD");
            expect(within(goldCard).getByText(/\+5% APY boost/i)).toBeInTheDocument();
        });

        it("should show benefits for Platinum tier (priority support)", () => {
            render(<TierExplainer />);
            const platinumCard = screen.getByTestId("tier-card-PLATINUM");
            expect(within(platinumCard).getByText(/priority support/i)).toBeInTheDocument();
        });

        it("should show benefits for Black tier (Metal Visa card)", () => {
            render(<TierExplainer />);
            const blackCard = screen.getByTestId("tier-card-BLACK");
            expect(within(blackCard).getByText(/metal visa/i)).toBeInTheDocument();
        });
    });

    describe("Current Tier Highlighting", () => {
        it("should highlight current tier with special styling", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({ tier: "SILVER" }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            const silverCard = screen.getByTestId("tier-card-SILVER");
            expect(silverCard).toHaveAttribute("data-current", "true");
        });

        it("should show 'Current' badge on current tier", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({ tier: "GOLD", network_volume: 6000 }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            const goldCard = screen.getByTestId("tier-card-GOLD");
            expect(within(goldCard).getByText(/current/i)).toBeInTheDocument();
        });

        it("should not highlight non-current tiers as current", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({ tier: "SILVER" }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            const bronzeCard = screen.getByTestId("tier-card-BRONZE");
            const goldCard = screen.getByTestId("tier-card-GOLD");

            expect(bronzeCard).not.toHaveAttribute("data-current", "true");
            expect(goldCard).not.toHaveAttribute("data-current", "true");
        });
    });

    describe("Progress Toward Next Tier", () => {
        it("should show progress toward next tier", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({
                    tier: "SILVER",
                    next_tier_progress: 70,
                    next_tier_remaining: "$1,500 to Gold",
                }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            expect(screen.getByTestId("tier-progress")).toBeInTheDocument();
            expect(screen.getByText(/\$1,500 to gold/i)).toBeInTheDocument();
        });

        it("should show progress bar with correct percentage", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({
                    tier: "SILVER",
                    next_tier_progress: 70,
                }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            const progressBar = screen.getByTestId("progress-bar");
            expect(progressBar).toHaveStyle({ width: "70%" });
        });

        it("should show 'Max tier reached' message for Black tier", () => {
            mockUseReferral.mockReturnValue({
                stats: createMockStats({
                    tier: "BLACK",
                    network_volume: 60000,
                    next_tier_progress: 100,
                    next_tier_remaining: "Max tier reached",
                }),
                referralCode: "ABC123",
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            expect(screen.getByText(/max tier reached/i)).toBeInTheDocument();
        });
    });

    describe("Loading State", () => {
        it("should show loading skeleton when loading", () => {
            mockUseReferral.mockReturnValue({
                stats: null,
                referralCode: null,
                loading: true,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            expect(screen.getByTestId("tier-explainer-skeleton")).toBeInTheDocument();
        });
    });

    describe("Error State", () => {
        it("should show error message when stats are null and not loading", () => {
            mockUseReferral.mockReturnValue({
                stats: null,
                referralCode: null,
                loading: false,
                createCode: vi.fn(),
            });
            render(<TierExplainer />);

            expect(screen.getByText(/unable to load tier information/i)).toBeInTheDocument();
        });
    });
});
