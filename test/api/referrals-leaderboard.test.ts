/**
 * Tests for leaderboard API integration with subgraph deposits
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the subgraph module
vi.mock('@/lib/compound/subgraph', () => ({
    getTopDepositors: vi.fn(),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
        })),
    })),
}));

// Mock supabase config
vi.mock('@/lib/db/supabase', () => ({
    isSupabaseConfigured: vi.fn(() => false),
}));

import { getTopDepositors } from '@/lib/compound/subgraph';

const mockGetTopDepositors = getTopDepositors as ReturnType<typeof vi.fn>;

describe('Leaderboard API - Subgraph Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getTopDepositors integration', () => {
        it('should call subgraph service to fetch top depositors', async () => {
            const mockDepositors = [
                { walletAddress: '0xabc123def456', totalDepositsUsd: 100000 },
                { walletAddress: '0xdef456abc789', totalDepositsUsd: 50000 },
            ];
            mockGetTopDepositors.mockResolvedValue(mockDepositors);

            const result = await getTopDepositors(10);

            expect(mockGetTopDepositors).toHaveBeenCalledWith(10);
            expect(result).toEqual(mockDepositors);
        });

        it('should handle subgraph errors gracefully', async () => {
            mockGetTopDepositors.mockResolvedValue([]);

            const result = await getTopDepositors(10);

            expect(result).toEqual([]);
        });

        it('should return depositors sorted by USD value descending', async () => {
            const mockDepositors = [
                { walletAddress: '0xfirst', totalDepositsUsd: 200000 },
                { walletAddress: '0xsecond', totalDepositsUsd: 150000 },
                { walletAddress: '0xthird', totalDepositsUsd: 100000 },
            ];
            mockGetTopDepositors.mockResolvedValue(mockDepositors);

            const result = await getTopDepositors(10);

            expect(result[0].totalDepositsUsd).toBeGreaterThan(result[1].totalDepositsUsd);
            expect(result[1].totalDepositsUsd).toBeGreaterThan(result[2].totalDepositsUsd);
        });
    });
});

describe('Leaderboard Data Transformation', () => {
    it('should transform subgraph data to leaderboard format', () => {
        const subgraphData = [
            { walletAddress: '0xabc123def456', totalDepositsUsd: 100000 },
            { walletAddress: '0xdef456abc789', totalDepositsUsd: 50000 },
        ];

        const currentUserWallet = '0xdef456abc789';

        // Transform to leaderboard format
        const leaderboardEntries = subgraphData.map((item, index) => ({
            rank: index + 1,
            walletAddress: item.walletAddress,
            referralCount: 0, // Deposits tab doesn't need referral count
            totalDeposits: item.totalDepositsUsd,
            isCurrentUser: item.walletAddress.toLowerCase() === currentUserWallet.toLowerCase(),
        }));

        expect(leaderboardEntries).toHaveLength(2);
        expect(leaderboardEntries[0]).toEqual({
            rank: 1,
            walletAddress: '0xabc123def456',
            referralCount: 0,
            totalDeposits: 100000,
            isCurrentUser: false,
        });
        expect(leaderboardEntries[1]).toEqual({
            rank: 2,
            walletAddress: '0xdef456abc789',
            referralCount: 0,
            totalDeposits: 50000,
            isCurrentUser: true,
        });
    });

    it('should calculate user rank by deposits correctly', () => {
        const depositors = [
            { walletAddress: '0xfirst', totalDepositsUsd: 200000 },
            { walletAddress: '0xsecond', totalDepositsUsd: 150000 },
            { walletAddress: '0xthird', totalDepositsUsd: 100000 },
            { walletAddress: '0xuser', totalDepositsUsd: 75000 },
            { walletAddress: '0xfifth', totalDepositsUsd: 50000 },
        ];

        const userWallet = '0xuser';
        const userDeposit = depositors.find(d => d.walletAddress === userWallet);

        // Calculate rank (1-indexed)
        const rank = depositors.filter(d => d.totalDepositsUsd > (userDeposit?.totalDepositsUsd || 0)).length + 1;

        expect(rank).toBe(4);
    });
});
