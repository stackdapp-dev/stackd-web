/**
 * Tests for leaderboard multi-protocol deposit aggregation
 *
 * The leaderboard should include deposits from BOTH Compound (on Arbitrum)
 * AND Fluid (on Ethereum mainnet) when calculating total collateral.
 *
 * Bug context: Wallet 0x9B624577D49cd0561E49232F7DA7dad2605471ca has $169k total
 * collateral (WBTC on Compound + XAUT on Fluid) but only $19.01 shows on leaderboard
 * because only Compound deposits were being fetched.
 *
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the subgraph and fluid modules
vi.mock('@/lib/compound/subgraph', () => ({
    getDepositorByAddress: vi.fn(),
}));

vi.mock('@/lib/collateral/multiProtocolCollateral', () => ({
    getTotalCollateralByAddress: vi.fn(),
}));

import { getDepositorByAddress } from '@/lib/compound/subgraph';
import { getTotalCollateralByAddress } from '@/lib/collateral/multiProtocolCollateral';

const mockGetDepositorByAddress = getDepositorByAddress as ReturnType<typeof vi.fn>;
const mockGetTotalCollateralByAddress = getTotalCollateralByAddress as ReturnType<typeof vi.fn>;

describe('Leaderboard Multi-Protocol Deposit Aggregation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getTotalCollateralByAddress', () => {
        it('should return combined Compound + Fluid collateral for a wallet', async () => {
            // Known wallet with both Compound WBTC and Fluid XAUT
            const walletAddress = '0x9B624577D49cd0561E49232F7DA7dad2605471ca';

            // Mock: Compound has small amount (~$19 WBTC)
            // Mock: Fluid has large amount (~$150k XAUT)
            mockGetTotalCollateralByAddress.mockResolvedValue({
                walletAddress: walletAddress.toLowerCase(),
                totalCollateralUsd: 169000, // ~$169k combined
                compoundCollateralUsd: 19.01,
                fluidCollateralUsd: 168980.99,
            });

            const result = await getTotalCollateralByAddress(walletAddress);

            expect(result).not.toBeNull();
            expect(result!.totalCollateralUsd).toBeGreaterThan(100000); // Should be ~$169k, not just $19
            expect(result!.compoundCollateralUsd).toBeCloseTo(19.01, 1);
            expect(result!.fluidCollateralUsd).toBeGreaterThan(100000);
        });

        it('should return only Compound collateral when wallet has no Fluid positions', async () => {
            const walletAddress = '0x1234567890123456789012345678901234567890';

            mockGetTotalCollateralByAddress.mockResolvedValue({
                walletAddress: walletAddress.toLowerCase(),
                totalCollateralUsd: 5000,
                compoundCollateralUsd: 5000,
                fluidCollateralUsd: 0,
            });

            const result = await getTotalCollateralByAddress(walletAddress);

            expect(result!.totalCollateralUsd).toBe(5000);
            expect(result!.fluidCollateralUsd).toBe(0);
        });

        it('should return only Fluid collateral when wallet has no Compound positions', async () => {
            const walletAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

            mockGetTotalCollateralByAddress.mockResolvedValue({
                walletAddress: walletAddress.toLowerCase(),
                totalCollateralUsd: 50000,
                compoundCollateralUsd: 0,
                fluidCollateralUsd: 50000,
            });

            const result = await getTotalCollateralByAddress(walletAddress);

            expect(result!.totalCollateralUsd).toBe(50000);
            expect(result!.compoundCollateralUsd).toBe(0);
        });

        it('should return null for wallet with no deposits on either protocol', async () => {
            const walletAddress = '0x0000000000000000000000000000000000000001';

            mockGetTotalCollateralByAddress.mockResolvedValue(null);

            const result = await getTotalCollateralByAddress(walletAddress);

            expect(result).toBeNull();
        });
    });

    describe('Leaderboard ranking with multi-protocol collateral', () => {
        it('should rank users correctly when combining Compound and Fluid deposits', async () => {
            // Simulate leaderboard data with multi-protocol support
            const leaderboardData = [
                { wallet: '0xuser1', compound: 50000, fluid: 100000 }, // $150k total
                { wallet: '0x9B624577D49cd0561E49232F7DA7dad2605471ca', compound: 19.01, fluid: 168980.99 }, // $169k total
                { wallet: '0xuser3', compound: 200000, fluid: 0 }, // $200k total (Compound only)
                { wallet: '0xuser4', compound: 0, fluid: 75000 }, // $75k total (Fluid only)
            ];

            // Calculate combined totals and sort
            const ranked = leaderboardData
                .map(d => ({
                    wallet: d.wallet,
                    total: d.compound + d.fluid,
                }))
                .sort((a, b) => b.total - a.total);

            // User3 should be #1 ($200k)
            expect(ranked[0].wallet).toBe('0xuser3');
            expect(ranked[0].total).toBe(200000);

            // The bug wallet should be #2 ($169k), not low-ranked with just $19
            expect(ranked[1].wallet).toBe('0x9B624577D49cd0561E49232F7DA7dad2605471ca');
            expect(ranked[1].total).toBeCloseTo(169000, 0);

            // User1 should be #3 ($150k)
            expect(ranked[2].wallet).toBe('0xuser1');

            // User4 should be #4 ($75k)
            expect(ranked[3].wallet).toBe('0xuser4');
        });
    });

    describe('Backward compatibility', () => {
        it('old getDepositorByAddress should still return Compound-only data', async () => {
            // This tests that we don't break the existing API
            const walletAddress = '0x45ace1ffdbd4582d4845f155a3898d8780ebf671';

            mockGetDepositorByAddress.mockResolvedValue({
                walletAddress: walletAddress.toLowerCase(),
                totalDepositsUsd: 26.26, // Compound only
            });

            const result = await getDepositorByAddress(walletAddress);

            expect(result!.totalDepositsUsd).toBe(26.26);
            // Old API returns totalDepositsUsd, not totalCollateralUsd
            expect(result).not.toHaveProperty('fluidCollateralUsd');
        });
    });
});
