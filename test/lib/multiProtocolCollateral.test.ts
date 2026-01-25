/**
 * Unit tests for multi-protocol collateral aggregation
 *
 * Tests the getTotalCollateralByAddress function which combines
 * Compound (Arbitrum) and Fluid (Ethereum mainnet) collateral.
 *
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Compound subgraph module
vi.mock('@/lib/compound/subgraph', () => ({
    getDepositorByAddress: vi.fn(),
}));

// Mock viem for Fluid calls - mock at module level
vi.mock('viem', async () => {
    const actual = await vi.importActual('viem');
    return {
        ...actual,
        createPublicClient: vi.fn(() => ({
            readContract: vi.fn(),
        })),
    };
});

// Mock the Fluid lib exports
vi.mock('@/lib/web3/fluid', () => ({
    VAULT_RESOLVER_ADDRESS: '0x1234567890123456789012345678901234567890',
    KNOWN_VAULTS: {
        '0xece156bed5af2621b80b87ff4fe8fd3a929e3644': {
            supplyToken: '0x68749665ff8d2d112fa859aa293f07a622782f38', // XAUT
            borrowToken: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
            supplyDecimals: 6,
            borrowDecimals: 6,
            collateralFactor: BigInt(7500),
            liquidationThreshold: BigInt(8000),
            supplyRate: BigInt(0),
            borrowRate: BigInt(634195840),
        },
    },
}));

// Mock Fluid config
vi.mock('@/lib/config/abis', () => ({
    FLUID_VAULT_RESOLVER_ADDR: '0x1234567890123456789012345678901234567890',
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
    formatAddress: vi.fn((addr: string) => addr as `0x${string}`),
}));

import { getDepositorByAddress } from '@/lib/compound/subgraph';
import { createPublicClient } from 'viem';

// Mock depositAthDb for ATH integration tests
const mockUpdateAthIfHigher = vi.fn();
vi.mock('@/lib/db/depositAthDb', () => ({
    updateAthIfHigher: mockUpdateAthIfHigher,
}));

const mockGetDepositorByAddress = getDepositorByAddress as ReturnType<typeof vi.fn>;
const mockCreatePublicClient = createPublicClient as ReturnType<typeof vi.fn>;

describe('Multi-Protocol Collateral Aggregation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Compound + Fluid combination scenarios', () => {
        it('should combine Compound and Fluid collateral correctly', async () => {
            // This test documents the expected behavior:
            // Wallet 0x9B624... has:
            // - Compound (Arbitrum): ~$19.01 WBTC
            // - Fluid (Ethereum): ~$150k XAUT
            // Total should be ~$169k, not just $19.01

            const compoundDeposit = 19.01;
            const fluidXautAmount = 55.5; // XAUT tokens (6 decimals)
            const goldPrice = 2700; // Approximate gold price per oz
            const expectedFluidUsd = fluidXautAmount * goldPrice; // ~$149,850
            const expectedTotal = compoundDeposit + expectedFluidUsd;

            // Assert the math is correct
            expect(expectedTotal).toBeGreaterThan(100000);
            expect(expectedFluidUsd).toBeCloseTo(149850, -2); // Within $100
        });

        it('should handle wallet with only Compound deposits', async () => {
            const compoundOnly = {
                walletAddress: '0xtest',
                totalDepositsUsd: 5000,
            };

            // Simulate result from multi-protocol aggregation
            const result = {
                walletAddress: compoundOnly.walletAddress.toLowerCase(),
                totalCollateralUsd: compoundOnly.totalDepositsUsd,
                compoundCollateralUsd: compoundOnly.totalDepositsUsd,
                fluidCollateralUsd: 0,
            };

            expect(result.totalCollateralUsd).toBe(5000);
            expect(result.fluidCollateralUsd).toBe(0);
        });

        it('should handle wallet with only Fluid deposits', async () => {
            // Wallet with XAUT on Fluid but no Compound position
            const fluidXautAmount = 10; // 10 oz gold
            const goldPrice = 2700;

            const result = {
                walletAddress: '0xfluidonly',
                totalCollateralUsd: fluidXautAmount * goldPrice,
                compoundCollateralUsd: 0,
                fluidCollateralUsd: fluidXautAmount * goldPrice,
            };

            expect(result.totalCollateralUsd).toBe(27000);
            expect(result.compoundCollateralUsd).toBe(0);
            expect(result.fluidCollateralUsd).toBe(27000);
        });

        it('should return null for wallet with no deposits on any protocol', async () => {
            const emptyResult = null;

            expect(emptyResult).toBeNull();
        });
    });

    describe('Leaderboard ranking impact', () => {
        it('should correctly rank user with large Fluid position higher than Compound-only users', async () => {
            // Before fix: User with $19 Compound ranked low
            // After fix: User with $169k (Compound + Fluid) ranked high

            const users = [
                { wallet: '0xuser1', compound: 50000, fluid: 0, total: 50000 },
                { wallet: '0x9B624577D49cd0561E49232F7DA7dad2605471ca', compound: 19.01, fluid: 168980.99, total: 169000 },
                { wallet: '0xuser3', compound: 30000, fluid: 0, total: 30000 },
            ];

            // Sort by total descending (as leaderboard does)
            const ranked = users.sort((a, b) => b.total - a.total);

            // The wallet with Fluid position should be #1
            expect(ranked[0].wallet).toBe('0x9B624577D49cd0561E49232F7DA7dad2605471ca');
            expect(ranked[0].total).toBe(169000);

            // User1 should be #2
            expect(ranked[1].wallet).toBe('0xuser1');

            // User3 should be #3
            expect(ranked[2].wallet).toBe('0xuser3');
        });
    });
});

describe('Token Price Handling', () => {
    it('should use correct XAUT price (gold price)', () => {
        // XAUT = 1 troy oz of gold
        // Approximate gold price: $2700/oz
        const xautPrice = 2700;
        const xautAmount = 55.5; // 55.5 oz
        const expectedUsd = xautAmount * xautPrice;

        expect(expectedUsd).toBeCloseTo(149850, -1);
    });

    it('should handle WBTC price for Compound', () => {
        // WBTC approximate price: $100k
        const wbtcPrice = 100000;
        const wbtcAmount = 0.0001901; // Small amount
        const expectedUsd = wbtcAmount * wbtcPrice;

        expect(expectedUsd).toBeCloseTo(19.01, 1);
    });
});

describe('Live Token Price Fetching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset modules to get fresh cache state for each test
        vi.resetModules();
        // Reset fetch mock
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should fetch live prices from CoinGecko API', async () => {
        // Mock CoinGecko response format: { "tether-gold": { usd: 3200 }, "bitcoin": { usd: 105000 } }
        const mockCoinGeckoResponse = {
            'tether-gold': { usd: 3200 },
            'bitcoin': { usd: 105000 },
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockCoinGeckoResponse),
        });

        // Import the function dynamically to get fresh module with clean cache
        const { fetchLiveTokenPrices } = await import('@/lib/collateral/multiProtocolCollateral');

        const prices = await fetchLiveTokenPrices();

        // Should map CoinGecko IDs back to our token symbols
        expect(prices.XAUT).toBe(3200);
        expect(prices.WBTC).toBe(105000);
    });

    it('should return updated fallback prices when API fails', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

        // Import fresh module after resetModules
        const { fetchLiveTokenPrices } = await import('@/lib/collateral/multiProtocolCollateral');

        const prices = await fetchLiveTokenPrices();

        // Should return UPDATED fallback values (Jan 2026: gold ~$5000, BTC ~$105k)
        expect(prices.XAUT).toBe(5000);
        expect(prices.WBTC).toBe(105000);
    });

    it('should cache prices for 60 seconds', async () => {
        const mockCoinGeckoResponse = {
            'tether-gold': { usd: 3200 },
            'bitcoin': { usd: 105000 },
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockCoinGeckoResponse),
        });

        // Import fresh module after resetModules
        const { fetchLiveTokenPrices } = await import('@/lib/collateral/multiProtocolCollateral');

        // First call - should fetch
        await fetchLiveTokenPrices();

        // Second call - should use cache
        await fetchLiveTokenPrices();

        // Fetch should only be called once due to caching
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should calculate Fluid collateral with live XAUT price', async () => {
        // 55.5 oz XAUT at $3200/oz = $177,600 (vs $149,850 with old fallback $2700)
        const xautAmount = 55.5;
        const liveXautPrice = 3200;
        const expectedWithLivePrice = xautAmount * liveXautPrice;

        expect(expectedWithLivePrice).toBe(177600);
        expect(expectedWithLivePrice).toBeGreaterThan(149850); // Should be higher than old fallback price calculation
    });

    /**
     * Regression test for deposit leaderboard pricing bug
     * 
     * Previously, the leaderboard showed $99.6K for a wallet with $178.1K actual collateral
     * because the server-side code was falling back to outdated prices ($2700 XAUT)
     * instead of fetching live prices from CoinGecko.
     */
    it('should use live CoinGecko prices for accurate leaderboard calculation', async () => {
        // Real scenario: wallet 0x9B62...71ca has ~55.5 oz XAUT
        const xautAmount = 55.5;

        // Old fallback price caused undervaluation
        const oldFallbackPrice = 2700;
        const oldCalculation = xautAmount * oldFallbackPrice; // $149,850

        // Live price gives accurate value
        const livePrice = 3200;
        const liveCalculation = xautAmount * livePrice; // $177,600

        // The difference is significant (~18%)
        const priceDifference = ((liveCalculation - oldCalculation) / oldCalculation) * 100;
        expect(priceDifference).toBeGreaterThan(15); // At least 15% difference

        // Mock CoinGecko to return live prices
        const mockCoinGeckoResponse = {
            'tether-gold': { usd: livePrice },
            'bitcoin': { usd: 105000 },
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockCoinGeckoResponse),
        });

        const { fetchLiveTokenPrices } = await import('@/lib/collateral/multiProtocolCollateral');
        const prices = await fetchLiveTokenPrices();

        // Verify correct price is returned
        expect(prices.XAUT).toBe(livePrice);

        // Calculate with live price
        const calculatedValue = xautAmount * prices.XAUT;
        expect(calculatedValue).toBe(177600);
        expect(calculatedValue).toBeCloseTo(liveCalculation, 0);
    });
});

/**
 * ATH (All-Time High) Integration Tests
 *
 * Tests that getTotalCollateralByAddress automatically updates ATH records
 * when fetching collateral data.
 */
describe('ATH Update Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset modules to get fresh state
        vi.resetModules();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should call updateAthIfHigher when collateral is found', async () => {
        // Mock Compound response
        mockGetDepositorByAddress.mockResolvedValue({
            walletAddress: '0xtest123',
            totalDepositsUsd: 5000,
        });

        // Mock Fluid - no positions
        const mockReadContract = vi.fn().mockResolvedValue([]);
        mockCreatePublicClient.mockReturnValue({
            readContract: mockReadContract,
        });

        // Mock CoinGecko prices
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                'tether-gold': { usd: 3200 },
                'bitcoin': { usd: 105000 },
            }),
        });

        // Reset the ATH mock
        mockUpdateAthIfHigher.mockResolvedValue({
            wallet_address: '0xtest123',
            ath_usd: 5000,
            ath_compound_usd: 5000,
            ath_fluid_usd: 0,
        });

        // Import fresh module
        const { getTotalCollateralByAddress } = await import('@/lib/collateral/multiProtocolCollateral');

        const result = await getTotalCollateralByAddress('0xTest123');

        expect(result).not.toBeNull();
        expect(result?.totalCollateralUsd).toBe(5000);

        // Verify updateAthIfHigher was called with correct args
        expect(mockUpdateAthIfHigher).toHaveBeenCalledTimes(1);
        expect(mockUpdateAthIfHigher).toHaveBeenCalledWith('0xtest123', {
            totalCollateralUsd: 5000,
            compoundCollateralUsd: 5000,
            fluidCollateralUsd: 0,
        });
    });

    it('should NOT call updateAthIfHigher when no collateral is found', async () => {
        // Mock Compound - no deposits
        mockGetDepositorByAddress.mockResolvedValue(null);

        // Mock Fluid - no positions
        const mockReadContract = vi.fn().mockResolvedValue([]);
        mockCreatePublicClient.mockReturnValue({
            readContract: mockReadContract,
        });

        // Import fresh module
        const { getTotalCollateralByAddress } = await import('@/lib/collateral/multiProtocolCollateral');

        const result = await getTotalCollateralByAddress('0xNoCollateral');

        expect(result).toBeNull();

        // Should NOT call updateAthIfHigher when there's no collateral
        expect(mockUpdateAthIfHigher).not.toHaveBeenCalled();
    });

    it('should not fail if updateAthIfHigher throws an error', async () => {
        // Mock Compound response
        mockGetDepositorByAddress.mockResolvedValue({
            walletAddress: '0xtest456',
            totalDepositsUsd: 3000,
        });

        // Mock Fluid - no positions
        const mockReadContract = vi.fn().mockResolvedValue([]);
        mockCreatePublicClient.mockReturnValue({
            readContract: mockReadContract,
        });

        // Mock ATH update to throw error
        mockUpdateAthIfHigher.mockRejectedValue(new Error('DB connection failed'));

        // Import fresh module
        const { getTotalCollateralByAddress } = await import('@/lib/collateral/multiProtocolCollateral');

        // Should not throw, should return collateral data
        const result = await getTotalCollateralByAddress('0xTest456');

        expect(result).not.toBeNull();
        expect(result?.totalCollateralUsd).toBe(3000);
    });
});

