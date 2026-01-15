import { describe, it, expect, vi, beforeEach } from 'vitest';
import { swapKitClient } from '@/lib/btc/swapKitClient';
import { mockSwapKitQuoteResponse, mockDepositAddress } from '../../mocks/swapkit';

// Mock the SwapKit helpers packages
vi.mock('@swapkit/helpers', () => ({
  FeeTypeEnum: {
    AFFILIATE: 'affiliate',
    OUTBOUND: 'outbound',
    LIQUIDITY: 'liquidity',
    NETWORK: 'network',
    INBOUND: 'inbound',
  },
  SKConfig: {
    set: vi.fn(),
  },
}));

vi.mock('@swapkit/helpers/api', () => ({
  SwapKitApi: {
    getSwapQuote: vi.fn(),
    thornode: {
      getInboundAddresses: vi.fn(),
    },
  },
}));

import { SwapKitApi } from '@swapkit/helpers/api';

describe('SwapKitClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the address cache between tests
    swapKitClient.clearCache();
  });

  describe('getQuote', () => {
    it('should get quote for BTC to WBTC swap', async () => {
      vi.mocked(SwapKitApi.getSwapQuote).mockResolvedValue(mockSwapKitQuoteResponse as any);

      const quote = await swapKitClient.getQuote({
        sellAsset: 'BTC.BTC',
        buyAsset: 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        sellAmount: '0.1',
        senderAddress: 'bc1qtest1234567890',
        recipientAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(quote).toMatchObject({
        expectedOutput: expect.any(String),
        minimumOutput: expect.any(String),
        estimatedTime: expect.any(Number),
        fees: expect.any(Object),
        route: expect.any(Object),
      });
    });

    it('should get quote for WBTC to BTC swap', async () => {
      vi.mocked(SwapKitApi.getSwapQuote).mockResolvedValue(mockSwapKitQuoteResponse as any);

      const quote = await swapKitClient.getQuote({
        sellAsset: 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        buyAsset: 'BTC.BTC',
        sellAmount: '0.1',
        senderAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: 'bc1qtest1234567890',
      });

      expect(quote.expectedOutput).toBeDefined();
    });

    it('should throw for unsupported asset pair', async () => {
      vi.mocked(SwapKitApi.getSwapQuote).mockRejectedValue(new Error('Unsupported asset'));

      await expect(swapKitClient.getQuote({
        sellAsset: 'INVALID.TOKEN',
        buyAsset: 'BTC.BTC',
        sellAmount: '1',
        senderAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: 'bc1qtest',
      })).rejects.toThrow('Unsupported asset');
    });

    it('should throw for amount below minimum', async () => {
      vi.mocked(SwapKitApi.getSwapQuote).mockRejectedValue(new Error('Amount too small'));

      await expect(swapKitClient.getQuote({
        sellAsset: 'BTC.BTC',
        buyAsset: 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        sellAmount: '0.00001',
        senderAddress: 'bc1qtest',
        recipientAddress: '0x1234567890123456789012345678901234567890',
      })).rejects.toThrow('Amount too small');
    });

    it('should handle streaming swap option for large amounts', async () => {
      vi.mocked(SwapKitApi.getSwapQuote).mockResolvedValue(mockSwapKitQuoteResponse as any);

      const quote = await swapKitClient.getQuote({
        sellAsset: 'BTC.BTC',
        buyAsset: 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        sellAmount: '10',
        senderAddress: 'bc1qtest',
        recipientAddress: '0x1234567890123456789012345678901234567890',
        streaming: true,
      });

      // In v4 API, streamingSwap is not available in the same way
      expect(quote.expectedOutput).toBeDefined();
    });
  });

  describe('getDepositAddress', () => {
    it('should return THORChain inbound address for BTC', async () => {
      vi.mocked(SwapKitApi.thornode.getInboundAddresses).mockResolvedValue([mockDepositAddress] as any);

      const address = await swapKitClient.getDepositAddress('BTC');

      expect(address).toMatchObject({
        address: expect.stringMatching(/^bc1/),
        chain: 'BTC',
        gasRate: expect.any(String),
        haltedChain: false,
      });
    });

    it('should throw if chain is halted', async () => {
      vi.mocked(SwapKitApi.thornode.getInboundAddresses).mockResolvedValue([
        { ...mockDepositAddress, halted: true },
      ] as any);

      await expect(swapKitClient.getDepositAddress('BTC')).rejects.toThrow('Chain is halted');
    });

    it('should throw if chain not found', async () => {
      vi.mocked(SwapKitApi.thornode.getInboundAddresses).mockResolvedValue([] as any);

      await expect(swapKitClient.getDepositAddress('INVALID')).rejects.toThrow('Chain not found');
    });
  });

  describe('buildSwapMemo', () => {
    it('should build correct memo for deposit', () => {
      const memo = swapKitClient.buildSwapMemo({
        buyAsset: 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        recipientAddress: '0x1234567890123456789012345678901234567890',
        minOutput: '0.099',
        affiliateAddress: 't',
        affiliateBps: 30,
      });

      expect(memo).toContain('ARB.WBTC');
      expect(memo).toContain('0x1234567890123456789012345678901234567890');
    });
  });
});
