import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { quoteService } from '@/lib/btc/quoteService';
import { swapKitClient } from '@/lib/btc/swapKitClient';
import { validateEvmAddress, validateBtcAddress } from '@/lib/btc/addressValidator';

// Mock dependencies
vi.mock('@/lib/btc/swapKitClient', () => ({
  swapKitClient: {
    getQuote: vi.fn(),
    getDepositAddress: vi.fn(),
    buildSwapMemo: vi.fn(),
  },
}));

vi.mock('@/lib/btc/addressValidator', () => ({
  validateEvmAddress: vi.fn(),
  validateBtcAddress: vi.fn(),
}));

describe('QuoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    quoteService.clearCache();

    // Default mock implementations
    vi.mocked(validateEvmAddress).mockReturnValue({ valid: true });
    vi.mocked(validateBtcAddress).mockReturnValue({ valid: true, network: 'mainnet', type: 'bech32' });
    vi.mocked(swapKitClient.getQuote).mockResolvedValue({
      expectedOutput: '0.099',
      minimumOutput: '0.098',
      estimatedTime: 600,
      fees: { affiliate: '0.0003', outbound: '0.0001', liquidity: '0.0002' },
      route: { providers: ['THORCHAIN'], sellAsset: 'BTC.BTC', buyAsset: 'ARB.WBTC' },
      warnings: [],
    });
    vi.mocked(swapKitClient.getDepositAddress).mockResolvedValue({
      chain: 'BTC',
      address: 'bc1qdeposit123',
      router: '',
      gasRate: '10',
      gasRateUnits: 'satsperbyte',
      halted: false,
      haltedChain: false,
      globalTradingPaused: false,
    });
    vi.mocked(swapKitClient.buildSwapMemo).mockReturnValue('=:ARB.WBTC:0x123:0.098');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDepositQuote', () => {
    it('should return formatted quote for BTC deposit', async () => {
      const quote = await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(quote).toMatchObject({
        inputAmount: '0.5',
        inputAsset: 'BTC',
        outputAmount: expect.any(String),
        outputAsset: 'WBTC',
        depositAddress: expect.stringMatching(/^bc1/),
        memo: expect.any(String),
        estimatedTime: expect.any(Number),
        fees: expect.any(Object),
        expiresAt: expect.any(Number),
        quoteId: expect.any(String),
      });
    });

    it('should validate EVM address before fetching quote', async () => {
      vi.mocked(validateEvmAddress).mockReturnValue({ valid: false, error: 'Invalid EVM address' });

      await expect(quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: 'invalid',
      })).rejects.toThrow('Invalid EVM address');
    });

    it('should reject amounts below minimum', async () => {
      await expect(quoteService.getDepositQuote({
        btcAmount: '0.0001',
        evmAddress: '0x1234567890123456789012345678901234567890',
      })).rejects.toThrow('below minimum');
    });

    it('should generate unique quoteId', async () => {
      const quote1 = await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      vi.advanceTimersByTime(1000);

      const quote2 = await quoteService.getDepositQuote({
        btcAmount: '0.6',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(quote1.quoteId).not.toBe(quote2.quoteId);
    });

    it('should set expiration time', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const quote = await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      // Quote should expire in 10 minutes
      expect(quote.expiresAt).toBe(now + 10 * 60 * 1000);
    });
  });

  describe('getWithdrawalQuote', () => {
    it('should return formatted quote for WBTC withdrawal', async () => {
      const quote = await quoteService.getWithdrawalQuote({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(quote).toMatchObject({
        inputAmount: '0.5',
        inputAsset: 'WBTC',
        outputAmount: expect.any(String),
        outputAsset: 'BTC',
        estimatedTime: expect.any(Number),
        fees: expect.any(Object),
        approvalRequired: expect.any(Boolean),
        quoteId: expect.any(String),
      });
    });

    it('should validate BTC address before fetching quote', async () => {
      vi.mocked(validateBtcAddress).mockReturnValue({ valid: false, error: 'Invalid BTC address' });

      await expect(quoteService.getWithdrawalQuote({
        wbtcAmount: '0.5',
        btcAddress: 'invalid',
        evmAddress: '0x1234567890123456789012345678901234567890',
      })).rejects.toThrow('Invalid BTC address');
    });

    it('should validate EVM address for withdrawal', async () => {
      vi.mocked(validateEvmAddress).mockReturnValue({ valid: false, error: 'Invalid EVM address' });

      await expect(quoteService.getWithdrawalQuote({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: 'invalid',
      })).rejects.toThrow('Invalid EVM address');
    });
  });

  describe('caching', () => {
    it('should return cached quote within TTL', async () => {
      const quote1 = await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      // Advance time by 15 seconds (within 30s TTL)
      vi.advanceTimersByTime(15000);

      const quote2 = await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(quote1.quoteId).toBe(quote2.quoteId);
      expect(swapKitClient.getQuote).toHaveBeenCalledTimes(1);
    });

    it('should refresh quote after TTL expires', async () => {
      await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      // Advance time by 35 seconds (beyond 30s TTL)
      vi.advanceTimersByTime(35000);

      await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(swapKitClient.getQuote).toHaveBeenCalledTimes(2);
    });

    it('should not cache quotes with different parameters', async () => {
      await quoteService.getDepositQuote({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      await quoteService.getDepositQuote({
        btcAmount: '0.6', // Different amount
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(swapKitClient.getQuote).toHaveBeenCalledTimes(2);
    });
  });
});
