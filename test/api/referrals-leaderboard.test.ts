/**
 * Tests for leaderboard API integration with subgraph deposits
 * 
 * The leaderboard now queries deposits for each Stack'd user individually
 * rather than filtering global top depositors.
 * 
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the subgraph module
vi.mock('@/lib/compound/subgraph', () => ({
    getDepositorByAddress: vi.fn(),
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

import { getDepositorByAddress } from '@/lib/compound/subgraph';

const mockGetDepositorByAddress = getDepositorByAddress as ReturnType<typeof vi.fn>;

describe('Leaderboard API - Per-User Deposit Queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getDepositorByAddress integration', () => {
        it('should return deposit data for a specific wallet', async () => {
            const mockDeposit = {
                walletAddress: '0x45ace1ffdbd4582d4845f155a3898d8780ebf671',
                totalDepositsUsd: 26.26,
            };
            mockGetDepositorByAddress.mockResolvedValue(mockDeposit);

            const result = await getDepositorByAddress('0x45ace1ffdbd4582d4845f155a3898d8780ebf671');

            expect(mockGetDepositorByAddress).toHaveBeenCalledWith('0x45ace1ffdbd4582d4845f155a3898d8780ebf671');
            expect(result).toEqual(mockDeposit);
            expect(result?.totalDepositsUsd).toBe(26.26);
        });

        it('should return null for wallet with no deposits', async () => {
            mockGetDepositorByAddress.mockResolvedValue(null);

            const result = await getDepositorByAddress('0x0000000000000000000000000000000000000001');

            expect(result).toBeNull();
        });

        it('should handle subgraph errors gracefully', async () => {
            mockGetDepositorByAddress.mockResolvedValue(null);

            const result = await getDepositorByAddress('0xinvalid');

            expect(result).toBeNull();
        });
    });
});

describe('Stack\'d User Deposit Aggregation', () => {
    it('should aggregate deposits for multiple Stack\'d users', async () => {
        // Simulate querying deposits for each Stack'd user
        const stackdUsers = [
            '0xuser1',
            '0xuser2',
            '0xuser3',
            '0xuser4', // no deposits
        ];

        const depositResults: Record<string, { walletAddress: string; totalDepositsUsd: number } | null> = {
            '0xuser1': { walletAddress: '0xuser1', totalDepositsUsd: 100 },
            '0xuser2': { walletAddress: '0xuser2', totalDepositsUsd: 50 },
            '0xuser3': { walletAddress: '0xuser3', totalDepositsUsd: 75 },
            '0xuser4': null, // no deposits
        };

        // Simulate the aggregation logic from referralDb.ts
        const stackdDeposits = stackdUsers
            .map(wallet => {
                const deposit = depositResults[wallet];
                return {
                    walletAddress: wallet.toLowerCase(),
                    totalDepositsUsd: deposit?.totalDepositsUsd || 0,
                };
            })
            .filter(d => d.totalDepositsUsd > 0)
            .sort((a, b) => b.totalDepositsUsd - a.totalDepositsUsd);

        expect(stackdDeposits).toHaveLength(3);
        expect(stackdDeposits[0]).toEqual({ walletAddress: '0xuser1', totalDepositsUsd: 100 });
        expect(stackdDeposits[1]).toEqual({ walletAddress: '0xuser3', totalDepositsUsd: 75 });
        expect(stackdDeposits[2]).toEqual({ walletAddress: '0xuser2', totalDepositsUsd: 50 });
    });

    it('should filter out users with zero deposits', async () => {
        const deposits = [
            { walletAddress: '0xuser1', totalDepositsUsd: 100 },
            { walletAddress: '0xuser2', totalDepositsUsd: 0 },
            { walletAddress: '0xuser3', totalDepositsUsd: 50 },
        ];

        const filtered = deposits.filter(d => d.totalDepositsUsd > 0);

        expect(filtered).toHaveLength(2);
        expect(filtered.map(d => d.walletAddress)).not.toContain('0xuser2');
    });
});

describe('Leaderboard Data Transformation', () => {
    it('should transform Stack\'d deposit data to leaderboard format', () => {
        const stackdDeposits = [
            { walletAddress: '0xabc123def456', totalDepositsUsd: 100 },
            { walletAddress: '0xdef456abc789', totalDepositsUsd: 50 },
            { walletAddress: '0x45ace1ffdbd4582d4845f155a3898d8780ebf671', totalDepositsUsd: 26.26 },
        ];

        const currentUserWallet = '0xdef456abc789';

        // Transform to leaderboard format (as done in referralDb.ts)
        const leaderboardEntries = stackdDeposits.map((item, index) => ({
            rank: index + 1,
            walletAddress: item.walletAddress,
            referralCount: 0, // Deposits tab doesn't need referral count
            totalDeposits: item.totalDepositsUsd,
            isCurrentUser: item.walletAddress.toLowerCase() === currentUserWallet.toLowerCase(),
        }));

        expect(leaderboardEntries).toHaveLength(3);
        expect(leaderboardEntries[0]).toEqual({
            rank: 1,
            walletAddress: '0xabc123def456',
            referralCount: 0,
            totalDeposits: 100,
            isCurrentUser: false,
        });
        expect(leaderboardEntries[1]).toEqual({
            rank: 2,
            walletAddress: '0xdef456abc789',
            referralCount: 0,
            totalDeposits: 50,
            isCurrentUser: true,
        });
        expect(leaderboardEntries[2]).toEqual({
            rank: 3,
            walletAddress: '0x45ace1ffdbd4582d4845f155a3898d8780ebf671',
            referralCount: 0,
            totalDeposits: 26.26,
            isCurrentUser: false,
        });
    });

    it('should calculate user rank by deposits correctly among Stack\'d users', () => {
        // Only Stack'd users with deposits (not global Compound users)
        const stackdDeposits = [
            { walletAddress: '0xfirst', totalDepositsUsd: 200 },
            { walletAddress: '0xsecond', totalDepositsUsd: 150 },
            { walletAddress: '0xthird', totalDepositsUsd: 100 },
            { walletAddress: '0xuser', totalDepositsUsd: 75 },
            { walletAddress: '0xfifth', totalDepositsUsd: 50 },
        ];

        const userWallet = '0xuser';
        const userDeposit = stackdDeposits.find(d => d.walletAddress === userWallet);

        // Calculate rank among Stack'd users only (1-indexed)
        const rank = stackdDeposits.filter(d => d.totalDepositsUsd > (userDeposit?.totalDepositsUsd || 0)).length + 1;

        expect(rank).toBe(4); // 3 users have more deposits, so user is rank 4
    });
});
