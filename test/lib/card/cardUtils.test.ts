/**
 * Card Utility Tests
 * TDD tests for card utility functions
 */
import { describe, it, expect } from 'vitest';
import {
    maskCardNumber,
    formatCardCurrency,
    calculateLimitPercentage,
    getCategoryIcon,
    formatExpiryDate,
    isValidCardLimit,
} from '@/lib/card/cardUtils';

describe('Card Utility Functions', () => {
    describe('maskCardNumber', () => {
        it('should mask card number showing last 4 digits spaced', () => {
            expect(maskCardNumber('1234')).toBe('•• •• 1 2 3 4');
        });

        it('should handle different last 4 digits', () => {
            expect(maskCardNumber('5678')).toBe('•• •• 5 6 7 8');
            expect(maskCardNumber('0000')).toBe('•• •• 0 0 0 0');
            expect(maskCardNumber('9999')).toBe('•• •• 9 9 9 9');
        });

        it('should return placeholder for invalid input', () => {
            expect(maskCardNumber('')).toBe('•• •• • • • •');
            expect(maskCardNumber('123')).toBe('•• •• • • • •');
            expect(maskCardNumber('12345')).toBe('•• •• • • • •');
        });
    });

    describe('formatCardCurrency', () => {
        it('should format positive amounts', () => {
            expect(formatCardCurrency(0)).toBe('$0.00');
            expect(formatCardCurrency(1234.56)).toBe('$1,234.56');
            expect(formatCardCurrency(10000)).toBe('$10,000.00');
        });

        it('should format negative amounts with minus sign', () => {
            expect(formatCardCurrency(-34.48)).toBe('-$34.48');
            expect(formatCardCurrency(-4.12)).toBe('-$4.12');
        });

        it('should show sign when requested', () => {
            expect(formatCardCurrency(100, true)).toBe('+$100.00');
            expect(formatCardCurrency(-100, true)).toBe('-$100.00');
            expect(formatCardCurrency(0, true)).toBe('$0.00');
        });
    });

    describe('calculateLimitPercentage', () => {
        it('should calculate percentage correctly', () => {
            expect(calculateLimitPercentage(5000, 10000)).toBe(50);
            expect(calculateLimitPercentage(2500, 10000)).toBe(25);
            expect(calculateLimitPercentage(10000, 10000)).toBe(100);
        });

        it('should handle zero balance', () => {
            expect(calculateLimitPercentage(0, 10000)).toBe(0);
        });

        it('should handle negative balance (spend)', () => {
            expect(calculateLimitPercentage(-5000, 10000)).toBe(50);
        });

        it('should cap at 100%', () => {
            expect(calculateLimitPercentage(15000, 10000)).toBe(100);
        });

        it('should return 0 for zero or negative limit', () => {
            expect(calculateLimitPercentage(5000, 0)).toBe(0);
            expect(calculateLimitPercentage(5000, -1000)).toBe(0);
        });
    });

    describe('getCategoryIcon', () => {
        it('should return correct icon for known categories', () => {
            expect(getCategoryIcon('Telecommunication Services')).toBe('phone');
            expect(getCategoryIcon('Eating Places, Restaurants')).toBe('utensils');
            expect(getCategoryIcon('Hotels, Motels, and Resorts')).toBe('building');
        });

        it('should return default icon for unknown categories', () => {
            expect(getCategoryIcon('Unknown Category')).toBe('credit-card');
            expect(getCategoryIcon('')).toBe('credit-card');
        });
    });

    describe('formatExpiryDate', () => {
        it('should format expiry date correctly', () => {
            expect(formatExpiryDate('12', '2028')).toBe('12/28');
            expect(formatExpiryDate('1', '2025')).toBe('01/25');
            expect(formatExpiryDate('06', '2030')).toBe('06/30');
        });
    });

    describe('isValidCardLimit', () => {
        it('should accept valid limits', () => {
            expect(isValidCardLimit(5000)).toBe(true);
            expect(isValidCardLimit(100)).toBe(true);
            expect(isValidCardLimit(100000)).toBe(true);
        });

        it('should reject limits below minimum', () => {
            expect(isValidCardLimit(50)).toBe(false);
            expect(isValidCardLimit(0)).toBe(false);
            expect(isValidCardLimit(-100)).toBe(false);
        });

        it('should reject limits above maximum', () => {
            expect(isValidCardLimit(150000)).toBe(false);
        });

        it('should accept custom min/max', () => {
            expect(isValidCardLimit(50, 10, 100)).toBe(true);
            expect(isValidCardLimit(5, 10, 100)).toBe(false);
        });

        it('should reject non-finite values', () => {
            expect(isValidCardLimit(Infinity)).toBe(false);
            expect(isValidCardLimit(NaN)).toBe(false);
        });
    });
});
