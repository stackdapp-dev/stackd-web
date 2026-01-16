/**
 * TDD Tests for Fluid Live Rate Fetching
 *
 * Tests the basis points (bps) rate to APR conversion to ensure Fluid's live borrow rates
 * are correctly converted and displayed (expected ~5.15% APR from getVaultEntireData)
 *
 * Fluid's borrowRateVault is in basis points format:
 * - 10000 bps = 100%
 * - 515 bps = 5.15% APR
 */
import { describe, it, expect } from 'vitest';
import {
    bpsRateToPerSecondRate,
    bpsRateToAprPercentage,
} from '@/lib/web3/fluid';

describe('Fluid Rate Conversion', () => {
    describe('bpsRateToAprPercentage', () => {
        it('should convert bps rate to APR percentage correctly (5.15%)', () => {
            // 515 bps = 5.15% APR (actual value from Fluid XAUT/USDT vault)
            const bpsRate = BigInt(515);
            const apr = bpsRateToAprPercentage(bpsRate);

            expect(apr).toBeCloseTo(5.15, 2);
        });

        it('should handle 2% APR', () => {
            // 200 bps = 2% APR
            const bpsRate = BigInt(200);
            const apr = bpsRateToAprPercentage(bpsRate);

            expect(apr).toBeCloseTo(2.0, 2);
        });

        it('should handle 10% APR', () => {
            // 1000 bps = 10% APR
            const bpsRate = BigInt(1000);
            const apr = bpsRateToAprPercentage(bpsRate);

            expect(apr).toBeCloseTo(10.0, 2);
        });

        it('should handle 0% APR', () => {
            const bpsRate = BigInt(0);
            const apr = bpsRateToAprPercentage(bpsRate);

            expect(apr).toBe(0);
        });

        it('should handle 100% APR', () => {
            // 10000 bps = 100% APR
            const bpsRate = BigInt(10000);
            const apr = bpsRateToAprPercentage(bpsRate);

            expect(apr).toBeCloseTo(100.0, 2);
        });
    });

    describe('bpsRateToPerSecondRate', () => {
        it('should convert bps rate to per-second rate for use with rateToApr hook function', () => {
            // 515 bps = 5.15% APR
            const bpsRate = BigInt(515);
            const perSecondRate = bpsRateToPerSecondRate(bpsRate);

            // The hook's rateToApr function: (rate / 1e18) * secondsPerYear * 100
            // So we need to verify that when we apply this, we get ~5.15%
            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const calculatedApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;

            expect(calculatedApr).toBeCloseTo(5.15, 1);
        });

        it('should produce correct APR when used with rateToApr formula', () => {
            // Test with 3.5% APR = 350 bps
            const bpsRate = BigInt(350);
            const perSecondRate = bpsRateToPerSecondRate(bpsRate);

            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const calculatedApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;

            expect(calculatedApr).toBeCloseTo(3.5, 1);
        });
    });

    describe('Integration: BPS rate flow', () => {
        it('should correctly convert Fluid 5.15% APR from bps format', () => {
            // Simulate a real Fluid borrow rate response
            // Fluid's getVaultEntireData returns borrowRateVault in bps format
            // 515 bps = 5.15% APR
            const fluidBorrowRateBps = BigInt(515);

            // Method 1: Direct conversion
            const directApr = bpsRateToAprPercentage(fluidBorrowRateBps);
            expect(directApr).toBeCloseTo(5.15, 2);

            // Method 2: Through per-second rate (for hook compatibility)
            const perSecondRate = bpsRateToPerSecondRate(fluidBorrowRateBps);
            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const hookApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;
            expect(hookApr).toBeCloseTo(5.15, 1);
        });

        it('fallback rate should produce ~2% APR', () => {
            // The hardcoded fallback: BigInt("634195840")
            // This is a per-second rate scaled by 1e18
            const fallbackPerSecondRate = BigInt("634195840");

            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const fallbackApr = (Number(fallbackPerSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;

            // Should be approximately 2%
            expect(fallbackApr).toBeCloseTo(2.0, 1);
        });

        it('200 bps should match fallback ~2% APR', () => {
            // 200 bps = 2% APR
            const bpsRate = BigInt(200);
            const perSecondRate = bpsRateToPerSecondRate(bpsRate);

            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const calculatedApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;

            expect(calculatedApr).toBeCloseTo(2.0, 1);
        });
    });
});
