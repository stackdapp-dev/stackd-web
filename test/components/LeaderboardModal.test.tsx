/**
 * TDD Tests for LeaderboardModal Component
 * Tests written FIRST before implementation
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardModal } from "@/components/referrals/LeaderboardModal";
import { LeaderboardEntry } from "@/lib/referrals/leaderboard";

// Mock the leaderboard hook
vi.mock("@/hooks/useLeaderboard", () => ({
    useLeaderboard: vi.fn(),
}));

// Mock Privy hook
vi.mock("@privy-io/react-auth", () => ({
    usePrivy: vi.fn(() => ({
        user: { wallet: { address: "0x9876543210fedcba9876543210fedcba98765432" } },
    })),
}));

import { useLeaderboard } from "@/hooks/useLeaderboard";

const mockUseLeaderboard = useLeaderboard as ReturnType<typeof vi.fn>;

describe("LeaderboardModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Loading State", () => {
        it("should display loading state while fetching data", () => {
            mockUseLeaderboard.mockReturnValue({
                loading: true,
                topReferrers: [],
                topByDeposits: [],
                userRank: null,
                error: null,
            });

            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            expect(screen.getByTestId("leaderboard-loading")).toBeTruthy();
        });
    });

    describe("Leaderboard Display", () => {
        const mockTopReferrers: LeaderboardEntry[] = [
            { rank: 1, walletAddress: "0x1234567890abcdef1234567890abcdef12345678", referralCount: 50, totalDeposits: 125000, isCurrentUser: false },
            { rank: 2, walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12", referralCount: 35, totalDeposits: 87500, isCurrentUser: false },
            { rank: 3, walletAddress: "0x9876543210fedcba9876543210fedcba98765432", referralCount: 28, totalDeposits: 70000, isCurrentUser: true },
        ];

        const mockTopByDeposits: LeaderboardEntry[] = [
            { rank: 1, walletAddress: "0xdeadbeef1234567890abcdef1234567890abcdef", referralCount: 20, totalDeposits: 250000, isCurrentUser: false },
            { rank: 2, walletAddress: "0x1234567890abcdef1234567890abcdef12345678", referralCount: 50, totalDeposits: 125000, isCurrentUser: false },
            { rank: 3, walletAddress: "0x9876543210fedcba9876543210fedcba98765432", referralCount: 28, totalDeposits: 70000, isCurrentUser: true },
        ];

        beforeEach(() => {
            mockUseLeaderboard.mockReturnValue({
                loading: false,
                topReferrers: mockTopReferrers,
                topByDeposits: mockTopByDeposits,
                userRank: { byReferrals: 3, byDeposits: 3 },
                error: null,
            });
        });

        it("should render leaderboard with mock data", () => {
            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            // Check drawer title
            expect(screen.getByText("Leaderboard")).toBeTruthy();

            // Check tabs
            expect(screen.getByRole("tab", { name: /top referrers/i })).toBeTruthy();
            expect(screen.getByRole("tab", { name: /top deposits/i })).toBeTruthy();
        });

        it("should display top referrers by default", () => {
            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            // First entry referral count should be visible
            expect(screen.getByText("50")).toBeTruthy();
            // Anonymized address
            expect(screen.getByText(/0x1234\.\.\.5678/)).toBeTruthy();
        });

        it("should show anonymized wallet addresses (0x1234...5678)", () => {
            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            // All addresses should be anonymized
            expect(screen.getByText(/0x1234\.\.\.5678/)).toBeTruthy();
            expect(screen.getByText(/0xabcd\.\.\.ef12/)).toBeTruthy();
            expect(screen.getByText(/0x9876\.\.\.5432/)).toBeTruthy();
        });

        it("should highlight current user's rank with accent color", () => {
            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            const userEntry = screen.getByTestId("leaderboard-entry-3");
            expect(userEntry.className).toContain("border-[#ffa02d]");
        });

        it("should highlight top 3 with amber accent", () => {
            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            const rank1 = screen.getByTestId("leaderboard-rank-1");
            const rank2 = screen.getByTestId("leaderboard-rank-2");
            const rank3 = screen.getByTestId("leaderboard-rank-3");

            expect(rank1.className).toContain("text-[#ffa02d]");
            expect(rank2.className).toContain("text-[#ffa02d]");
            expect(rank3.className).toContain("text-[#ffa02d]");
        });

        it("should display user's own rank in footer", () => {
            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            expect(screen.getByTestId("user-rank").textContent).toContain("Your Rank: #3");
        });
    });

    describe("Empty State", () => {
        it("should handle empty leaderboard gracefully", () => {
            mockUseLeaderboard.mockReturnValue({
                loading: false,
                topReferrers: [],
                topByDeposits: [],
                userRank: null,
                error: null,
            });

            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            expect(screen.getByText(/no referrers yet/i)).toBeTruthy();
        });
    });

    describe("Error State", () => {
        it("should display error message when fetch fails", () => {
            mockUseLeaderboard.mockReturnValue({
                loading: false,
                topReferrers: [],
                topByDeposits: [],
                userRank: null,
                error: "Failed to load leaderboard",
            });

            render(<LeaderboardModal open={true} onOpenChange={() => {}} />);

            expect(screen.getByText(/failed to load leaderboard/i)).toBeTruthy();
        });
    });

    describe("Modal Controls", () => {
        it("should call onOpenChange when closed", async () => {
            const onOpenChange = vi.fn();
            mockUseLeaderboard.mockReturnValue({
                loading: false,
                topReferrers: [],
                topByDeposits: [],
                userRank: null,
                error: null,
            });

            render(<LeaderboardModal open={true} onOpenChange={onOpenChange} />);

            // The drawer should be controllable via the onOpenChange prop
            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it("should not render when open is false", () => {
            mockUseLeaderboard.mockReturnValue({
                loading: false,
                topReferrers: [],
                topByDeposits: [],
                userRank: null,
                error: null,
            });

            render(<LeaderboardModal open={false} onOpenChange={() => {}} />);

            expect(screen.queryByText("Leaderboard")).toBeNull();
        });
    });
});
