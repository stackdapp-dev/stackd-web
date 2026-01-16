/**
 * TDD Tests for Fluid Live Rate Fetching
 * 
 * Tests the ray rate to APR conversion to ensure Fluid's live borrow rates
 * are correctly converted and displayed (expected ~5.25% APR, not 2% fallback)
 */
import { describe, it, expect } from 'vitest';
import {
    rayRateToPerSecondRate,
    rayRateToAprPercentage,
} from '@/lib/web3/fluid';

describe('Fluid Rate Conversion', () => {
    describe('rayRateToAprPercentage', () => {
        it('should convert ray rate to APR percentage correctly', () => {
            // 5.25% APR in ray format = 0.0525 * 1e27 = 5.25e25
            const rayRate = BigInt('52500000000000000000000000'); // 5.25e25
            const apr = rayRateToAprPercentage(rayRate);

            expect(apr).toBeCloseTo(5.25, 2);
        });

        it('should handle 2% APR (the fallback rate equiv)', () => {
            // 2% APR in ray format = 0.02 * 1e27 = 2e25
            const rayRate = BigInt('20000000000000000000000000'); // 2e25
            const apr = rayRateToAprPercentage(rayRate);

            expect(apr).toBeCloseTo(2.0, 2);
        });

        it('should handle 10% APR', () => {
            // 10% APR in ray format = 0.1 * 1e27 = 1e26
            const rayRate = BigInt('100000000000000000000000000'); // 1e26
            const apr = rayRateToAprPercentage(rayRate);

            expect(apr).toBeCloseTo(10.0, 2);
        });

        it('should handle 0% APR', () => {
            const rayRate = BigInt(0);
            const apr = rayRateToAprPercentage(rayRate);

            expect(apr).toBe(0);
        });
    });

    describe('rayRateToPerSecondRate', () => {
        it('should convert ray rate to per-second rate for use with rateToApr hook function', () => {
            // 5.25% APR in ray format
            const rayRate = BigInt('52500000000000000000000000'); // 5.25e25
            const perSecondRate = rayRateToPerSecondRate(rayRate);

            // The hook's rateToApr function: (rate / 1e18) * secondsPerYear * 100
            // So we need to verify that when we apply this, we get ~5.25%
            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const calculatedApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;

            expect(calculatedApr).toBeCloseTo(5.25, 1);
        });

        it('should produce correct APR when used with rateToApr formula', () => {
            // Test with 3.5% APR
            const rayRate = BigInt('35000000000000000000000000'); // 3.5e25 = 3.5% in ray
            const perSecondRate = rayRateToPerSecondRate(rayRate);

            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const calculatedApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;

            expect(calculatedApr).toBeCloseTo(3.5, 1);
        });
    });

    describe('Integration: Ray rate flow', () => {
        it('should correctly convert Fluid 5.25% APR from ray format', () => {
            // Simulate a real Fluid borrow rate response
            // Fluid returns borrowRateVault in ray format where 1e27 = 100%
            // For 5.25% APR: 5.25 / 100 * 1e27 = 5.25e25
            const fluidBorrowRateRay = BigInt('52500000000000000000000000');

            // Method 1: Direct conversion
            const directApr = rayRateToAprPercentage(fluidBorrowRateRay);
            expect(directApr).toBeCloseTo(5.25, 2);

            // Method 2: Through per-second rate (for hook compatibility)
            const perSecondRate = rayRateToPerSecondRate(fluidBorrowRateRay);
            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const hookApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;
            expect(hookApr).toBeCloseTo(5.25, 1);
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
    });
});
