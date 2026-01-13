import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withdrawalService } from '@/lib/btc/withdrawalService';
import { quoteService } from '@/lib/btc/quoteService';
import { txMonitor } from '@/lib/btc/txMonitor';
import { validateBtcAddress, validateEvmAddress } from '@/lib/btc/addressValidator';

// Mock dependencies
vi.mock('@/lib/btc/quoteService', () => ({
  quoteService: {
    getWithdrawalQuote: vi.fn(),
  },
}));

vi.mock('@/lib/btc/txMonitor', () => ({
  txMonitor: {
    getTransactionStatus: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock('@/lib/btc/addressValidator', () => ({
  validateBtcAddress: vi.fn(),
  validateEvmAddress: vi.fn(),
}));

describe('WithdrawalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(validateBtcAddress).mockReturnValue({ valid: true, network: 'mainnet', type: 'bech32' });
    vi.mocked(validateEvmAddress).mockReturnValue({ valid: true });
    vi.mocked(quoteService.getWithdrawalQuote).mockResolvedValue({
      inputAmount: '0.5',
      inputAsset: 'WBTC',
      outputAmount: '0.495',
      outputAsset: 'BTC',
      estimatedTime: 600,
      fees: { affiliate: '0.0015', outbound: '0.0001', liquidity: '0.0001' },
      approvalRequired: true,
      quoteId: 'quote-456',
      expiresAt: Date.now() + 600000,
    });
  });

  describe('initiateWithdrawal', () => {
    it('should return withdrawal details with approval requirement', async () => {
      const withdrawal = await withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(withdrawal).toMatchObject({
        withdrawalId: expect.any(String),
        inputAmount: '0.5',
        expectedOutput: expect.any(String),
        btcAddress: expect.any(String),
        approvalTx: expect.any(Object),
        status: 'pending_approval',
      });
    });

    it('should skip approval if already approved', async () => {
      vi.mocked(quoteService.getWithdrawalQuote).mockResolvedValue({
        inputAmount: '0.5',
        inputAsset: 'WBTC',
        outputAmount: '0.495',
        outputAsset: 'BTC',
        estimatedTime: 600,
        fees: { affiliate: '0.0015', outbound: '0.0001', liquidity: '0.0001' },
        approvalRequired: false, // Already has allowance
        quoteId: 'quote-456',
        expiresAt: Date.now() + 600000,
      });

      const withdrawal = await withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(withdrawal.status).toBe('ready_to_swap');
      expect(withdrawal.approvalTx).toBeNull();
    });

    it('should validate BTC address before initiating', async () => {
      vi.mocked(validateBtcAddress).mockReturnValue({ valid: false, error: 'Invalid BTC address' });

      await expect(withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'invalid',
        evmAddress: '0x1234567890123456789012345678901234567890',
      })).rejects.toThrow('Invalid BTC address');
    });

    it('should validate EVM address before initiating', async () => {
      vi.mocked(validateEvmAddress).mockReturnValue({ valid: false, error: 'Invalid EVM address' });

      await expect(withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: 'invalid',
      })).rejects.toThrow('Invalid EVM address');
    });

    it('should reject testnet BTC addresses for mainnet withdrawals', async () => {
      vi.mocked(validateBtcAddress).mockReturnValue({ valid: true, network: 'testnet', type: 'bech32' });

      await expect(withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'tb1qtest',
        evmAddress: '0x1234567890123456789012345678901234567890',
      })).rejects.toThrow('Testnet addresses not supported');
    });
  });

  describe('confirmApproval', () => {
    it('should update status after approval confirmed', async () => {
      const withdrawal = await withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      const updated = await withdrawalService.confirmApproval({
        withdrawalId: withdrawal.withdrawalId,
        approvalTxHash: 'approve_tx_123',
      });

      expect(updated.status).toBe('ready_to_swap');
      expect(updated.approvalTxHash).toBe('approve_tx_123');
    });

    it('should throw for unknown withdrawalId', async () => {
      await expect(withdrawalService.confirmApproval({
        withdrawalId: 'unknown',
        approvalTxHash: 'tx123',
      })).rejects.toThrow('Withdrawal not found');
    });
  });

  describe('executeWithdrawal', () => {
    it('should submit swap transaction', async () => {
      const withdrawal = await withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      // Skip approval
      await withdrawalService.confirmApproval({
        withdrawalId: withdrawal.withdrawalId,
        approvalTxHash: 'approve_tx_123',
      });

      const result = await withdrawalService.executeWithdrawal({
        withdrawalId: withdrawal.withdrawalId,
        swapTxHash: 'swap_tx_123',
      });

      expect(result).toMatchObject({
        status: 'swap_submitted',
        swapTxHash: 'swap_tx_123',
      });
    });

    it('should throw if not ready to swap', async () => {
      const withdrawal = await withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      // Don't confirm approval
      await expect(withdrawalService.executeWithdrawal({
        withdrawalId: withdrawal.withdrawalId,
        swapTxHash: 'swap_tx_123',
      })).rejects.toThrow('Withdrawal not ready');
    });
  });

  describe('getWithdrawalStatus', () => {
    it('should return detailed status', async () => {
      const withdrawal = await withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      const status = await withdrawalService.getWithdrawalStatus(withdrawal.withdrawalId);

      expect(status).toMatchObject({
        withdrawalId: withdrawal.withdrawalId,
        status: expect.any(String),
        timeline: expect.any(Array),
      });
    });

    it('should include BTC tx hash when completed', async () => {
      const withdrawal = await withdrawalService.initiateWithdrawal({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        evmAddress: '0x1234567890123456789012345678901234567890',
      });

      await withdrawalService.confirmApproval({
        withdrawalId: withdrawal.withdrawalId,
        approvalTxHash: 'approve_tx',
      });

      await withdrawalService.executeWithdrawal({
        withdrawalId: withdrawal.withdrawalId,
        swapTxHash: 'swap_tx',
      });

      vi.mocked(txMonitor.getTransactionStatus).mockResolvedValue({
        status: 'completed',
        stage: 'complete',
        confirmations: 6,
        outputTxHash: 'btc_output_tx',
        outputAmount: '0.495',
      });

      const status = await withdrawalService.getWithdrawalStatus(withdrawal.withdrawalId);

      expect(status.btcTxHash).toBe('btc_output_tx');
    });
  });
});
