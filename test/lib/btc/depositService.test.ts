import { describe, it, expect, vi, beforeEach } from 'vitest';
import { depositService } from '@/lib/btc/depositService';
import { quoteService } from '@/lib/btc/quoteService';
import { txMonitor } from '@/lib/btc/txMonitor';
import { validateEvmAddress } from '@/lib/btc/addressValidator';

// Mock dependencies
vi.mock('@/lib/btc/quoteService', () => ({
  quoteService: {
    getDepositQuote: vi.fn(),
  },
}));

vi.mock('@/lib/btc/txMonitor', () => ({
  txMonitor: {
    getTransactionStatus: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock('@/lib/btc/addressValidator', () => ({
  validateEvmAddress: vi.fn(),
}));

describe('DepositService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(validateEvmAddress).mockReturnValue({ valid: true });
    vi.mocked(quoteService.getDepositQuote).mockResolvedValue({
      inputAmount: '0.5',
      inputAsset: 'BTC',
      outputAmount: '0.495',
      outputAsset: 'WBTC',
      depositAddress: 'bc1qdeposit123',
      memo: 'SWAP:ARB.WBTC:0x1234...',
      estimatedTime: 600,
      fees: { network: '0.0001', affiliate: '0.0015' },
      expiresAt: Date.now() + 600000,
      quoteId: 'quote-123',
    });
  });

  describe('initiateDeposit', () => {
    it('should return deposit instructions', async () => {
      const deposit = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(deposit).toMatchObject({
        depositId: expect.any(String),
        depositAddress: expect.stringMatching(/^bc1/),
        memo: expect.any(String),
        expectedAmount: '0.5',
        expectedOutput: expect.any(String),
        expiresAt: expect.any(Number),
        status: 'awaiting_deposit',
      });
    });

    it('should generate unique depositId', async () => {
      const deposit1 = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      const deposit2 = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(deposit1.depositId).not.toBe(deposit2.depositId);
    });

    it('should validate EVM address before initiating', async () => {
      vi.mocked(validateEvmAddress).mockReturnValue({ valid: false, error: 'Invalid EVM address' });

      await expect(depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: 'invalid',
      })).rejects.toThrow('Invalid EVM address');
    });

    it('should store deposit for later retrieval', async () => {
      const deposit = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      const retrieved = await depositService.getDeposit(deposit.depositId);
      expect(retrieved).toMatchObject({ depositId: deposit.depositId });
    });
  });

  describe('confirmDeposit', () => {
    it('should update status when BTC transaction detected', async () => {
      const deposit = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      vi.mocked(txMonitor.getTransactionStatus).mockResolvedValue({
        status: 'processing',
        stage: 'swap_in_progress',
        confirmations: 3,
      });

      const status = await depositService.confirmDeposit({
        depositId: deposit.depositId,
        btcTxHash: 'btctx123',
      });

      expect(status.status).toBe('btc_received');
      expect(status.btcTxHash).toBe('btctx123');
    });

    it('should handle underpayment', async () => {
      const deposit = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      const status = await depositService.confirmDeposit({
        depositId: deposit.depositId,
        btcTxHash: 'btctx_underpaid',
        receivedAmount: '0.4', // Less than expected
      });

      expect(status).toMatchObject({
        status: 'underpaid',
        expectedAmount: '0.5',
        receivedAmount: '0.4',
        action: 'refund_or_proceed',
      });
    });

    it('should throw for unknown depositId', async () => {
      await expect(depositService.confirmDeposit({
        depositId: 'unknown',
        btcTxHash: 'btctx123',
      })).rejects.toThrow('Deposit not found');
    });
  });

  describe('getDepositStatus', () => {
    it('should return full status with timeline', async () => {
      const deposit = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      const status = await depositService.getDepositStatus(deposit.depositId);

      expect(status).toMatchObject({
        depositId: deposit.depositId,
        status: expect.any(String),
        timeline: expect.arrayContaining([
          expect.objectContaining({
            stage: expect.any(String),
            timestamp: expect.any(Number),
          }),
        ]),
      });
    });

    it('should include swap progress for processing deposits', async () => {
      const deposit = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      await depositService.confirmDeposit({
        depositId: deposit.depositId,
        btcTxHash: 'btctx123',
      });

      vi.mocked(txMonitor.getTransactionStatus).mockResolvedValue({
        status: 'processing',
        stage: 'swap_in_progress',
        confirmations: 6,
        estimatedCompletion: Date.now() + 300000,
      });

      const status = await depositService.getDepositStatus(deposit.depositId);

      expect(status.estimatedCompletion).toBeDefined();
    });

    it('should throw for unknown depositId', async () => {
      await expect(depositService.getDepositStatus('unknown')).rejects.toThrow('Deposit not found');
    });
  });

  describe('subscribeToDeposit', () => {
    it('should forward transaction monitor updates', async () => {
      const deposit = await depositService.initiateDeposit({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      await depositService.confirmDeposit({
        depositId: deposit.depositId,
        btcTxHash: 'btctx123',
      });

      let callbackCalled = false;
      vi.mocked(txMonitor.subscribe).mockImplementation((_, callback) => {
        callback({ status: 'completed', stage: 'complete', confirmations: 6, outputTxHash: 'out123', outputAmount: '0.495' });
        callbackCalled = true;
        return () => {};
      });

      depositService.subscribeToDeposit(deposit.depositId, () => {});

      expect(callbackCalled).toBe(true);
    });
  });
});
