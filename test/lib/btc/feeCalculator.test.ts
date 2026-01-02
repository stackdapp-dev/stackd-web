import { describe, it, expect } from 'vitest';
import {
  calculateTotalFees,
  estimateNetworkFee,
  formatFeeBreakdown,
  calculateMinimumOutput
} from '@/lib/btc/feeCalculator';

describe('FeeCalculator', () => {
  describe('calculateTotalFees', () => {
    it('should calculate fees for a standard swap', () => {
      const result = calculateTotalFees({
        inputAmount: '1.0',
        affiliateBps: 30, // 0.3%
        slippageBps: 100, // 1%
      });

      expect(result).toMatchObject({
        networkFee: expect.any(String),
        affiliateFee: '0.003',
        slippageEstimate: '0.01',
        totalFeePercent: expect.any(Number),
        outputEstimate: expect.any(String),
      });
    });

    it('should handle zero affiliate fee', () => {
      const result = calculateTotalFees({
        inputAmount: '0.5',
        affiliateBps: 0,
        slippageBps: 50
      });
      expect(result.affiliateFee).toBe('0');
    });

    it('should handle large amounts correctly', () => {
      const result = calculateTotalFees({
        inputAmount: '10.0',
        affiliateBps: 30,
        slippageBps: 100,
      });
      expect(result.affiliateFee).toBe('0.03');
    });

    it('should throw for negative amounts', () => {
      expect(() => calculateTotalFees({
        inputAmount: '-1',
        affiliateBps: 30,
        slippageBps: 100
      })).toThrow('Amount must be positive');
    });

    it('should throw for zero amounts', () => {
      expect(() => calculateTotalFees({
        inputAmount: '0',
        affiliateBps: 30,
        slippageBps: 100
      })).toThrow('Amount must be positive');
    });

    it('should throw for amounts below dust limit', () => {
      expect(() => calculateTotalFees({
        inputAmount: '0.00001',
        affiliateBps: 30,
        slippageBps: 100
      })).toThrow('Amount below minimum');
    });

    it('should throw for invalid amount format', () => {
      expect(() => calculateTotalFees({
        inputAmount: 'invalid',
        affiliateBps: 30,
        slippageBps: 100
      })).toThrow('Invalid amount format');
    });
  });

  describe('estimateNetworkFee', () => {
    it('should return higher fee for faster confirmation', () => {
      const fast = estimateNetworkFee('fast');
      const normal = estimateNetworkFee('normal');
      const slow = estimateNetworkFee('slow');

      expect(Number(fast)).toBeGreaterThan(Number(normal));
      expect(Number(normal)).toBeGreaterThan(Number(slow));
    });

    it('should return fee as string', () => {
      const fee = estimateNetworkFee('normal');
      expect(typeof fee).toBe('string');
    });
  });

  describe('calculateMinimumOutput', () => {
    it('should calculate minimum output with slippage', () => {
      const result = calculateMinimumOutput({
        expectedOutput: '1.0',
        slippageBps: 100, // 1%
      });
      expect(result).toBe('0.99');
    });

    it('should handle zero slippage', () => {
      const result = calculateMinimumOutput({
        expectedOutput: '1.0',
        slippageBps: 0,
      });
      expect(result).toBe('1.0');
    });
  });

  describe('formatFeeBreakdown', () => {
    it('should format fees for display', () => {
      const breakdown = formatFeeBreakdown({
        networkFee: '0.0001',
        affiliateFee: '0.003',
        slippageEstimate: '0.01',
        inputAsset: 'BTC',
      });

      expect(breakdown).toContain('Network Fee');
      expect(breakdown).toContain('0.0001 BTC');
      expect(breakdown).toContain('Affiliate Fee');
      expect(breakdown).toContain('Slippage');
    });
  });
});
