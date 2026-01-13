import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { txMonitor, TransactionStatus } from '@/lib/btc/txMonitor';

// Mock fetch
global.fetch = vi.fn();

describe('TransactionMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTransactionStatus', () => {
    it('should return pending status for new transaction', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'pending',
            in: [{ txID: 'txhash123' }],
            out: [],
          }],
        }),
      } as Response);

      const status = await txMonitor.getTransactionStatus('txhash123');

      expect(status).toMatchObject({
        status: 'pending',
        confirmations: 0,
        stage: 'awaiting_confirmation',
      });
    });

    it('should return processing status during swap', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'success',
            type: 'swap',
            in: [{ txID: 'txhash_processing', confirmationCountIn: 3 }],
            out: [],
            metadata: {
              swap: { streamingSwapMeta: { count: 5, quantity: 10 } },
            },
          }],
        }),
      } as Response);

      const status = await txMonitor.getTransactionStatus('txhash_processing');

      expect(status).toMatchObject({
        status: 'processing',
        stage: 'swap_in_progress',
        confirmations: 3,
      });
    });

    it('should return completed status with output details', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'success',
            type: 'swap',
            in: [{ txID: 'txhash_complete', confirmationCountIn: 6 }],
            out: [{ txID: 'output_tx_123', coins: [{ amount: '9900000', asset: 'ARB.WBTC' }] }],
          }],
        }),
      } as Response);

      const status = await txMonitor.getTransactionStatus('txhash_complete');

      expect(status).toMatchObject({
        status: 'completed',
        stage: 'complete',
        outputTxHash: 'output_tx_123',
        outputAmount: expect.any(String),
        confirmations: 6,
      });
    });

    it('should return failed status with error details', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'success',
            type: 'refund',
            in: [{ txID: 'txhash_failed' }],
            out: [{ txID: 'refund_tx_123' }],
            metadata: { refund: { reason: 'Slippage too high' } },
          }],
        }),
      } as Response);

      const status = await txMonitor.getTransactionStatus('txhash_failed');

      expect(status).toMatchObject({
        status: 'failed',
        stage: 'failed',
        error: 'Slippage too high',
        refundTxHash: 'refund_tx_123',
      });
    });

    it('should return not_found for unknown transaction', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: [] }),
      } as Response);

      const status = await txMonitor.getTransactionStatus('unknown_tx');

      expect(status).toMatchObject({
        status: 'not_found',
        stage: 'not_found',
      });
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(txMonitor.getTransactionStatus('txhash')).rejects.toThrow('Failed to fetch transaction status');
    });
  });

  describe('subscribeToTransaction', () => {
    it('should emit status updates', async () => {
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            actions: [{
              status: callCount < 3 ? 'pending' : 'success',
              type: 'swap',
              in: [{ txID: 'txhash123', confirmationCountIn: callCount }],
              out: callCount >= 3 ? [{ txID: 'output_tx', coins: [{ amount: '1000000', asset: 'WBTC' }] }] : [],
            }],
          }),
        } as Response;
      });

      const updates: TransactionStatus[] = [];
      const unsubscribe = txMonitor.subscribe('txhash123', (status) => {
        updates.push(status);
      });

      // Fast-forward through polling intervals
      await vi.advanceTimersByTimeAsync(30000); // 3 polls at 10s each

      unsubscribe();

      expect(updates.length).toBeGreaterThan(0);
    });

    it('should stop polling after completion', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'success',
            type: 'swap',
            in: [{ txID: 'txhash123' }],
            out: [{ txID: 'output_tx', coins: [{ amount: '1000000', asset: 'WBTC' }] }],
          }],
        }),
      } as Response);

      const updates: TransactionStatus[] = [];
      txMonitor.subscribe('txhash123', (status) => {
        updates.push(status);
      });

      await vi.advanceTimersByTimeAsync(30000);

      // Should only poll until completion
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribe', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'pending',
            in: [{ txID: 'txhash123' }],
            out: [],
          }],
        }),
      } as Response);

      const unsubscribe = txMonitor.subscribe('txhash123', () => {});

      await vi.advanceTimersByTimeAsync(10000);
      unsubscribe();
      await vi.advanceTimersByTimeAsync(20000);

      // Should stop after unsubscribe
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStreamingSwapProgress', () => {
    it('should return progress for streaming swap', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'success',
            type: 'swap',
            in: [{ txID: 'streaming_tx' }],
            out: [],
            metadata: {
              swap: {
                streamingSwapMeta: {
                  count: 5,
                  quantity: 10,
                },
              },
            },
          }],
        }),
      } as Response);

      const progress = await txMonitor.getStreamingSwapProgress('streaming_tx');

      expect(progress).toMatchObject({
        totalSubSwaps: 10,
        completedSubSwaps: 5,
        percentComplete: 50,
      });
    });

    it('should return null for non-streaming swap', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [{
            status: 'pending',
            in: [{ txID: 'normal_tx' }],
            out: [],
          }],
        }),
      } as Response);

      const progress = await txMonitor.getStreamingSwapProgress('normal_tx');

      expect(progress).toBeNull();
    });
  });
});
