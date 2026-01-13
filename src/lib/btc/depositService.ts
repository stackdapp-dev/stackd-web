/**
 * Deposit Service for BTC → WBTC flow orchestration
 * Coordinates between quote service, address validator, and transaction monitor
 */

import { quoteService } from './quoteService';
import { txMonitor, TransactionStatus } from './txMonitor';
import { validateEvmAddress } from './addressValidator';

// Deposit status types
export type DepositStatusType =
  | 'awaiting_deposit'
  | 'btc_received'
  | 'swap_processing'
  | 'completed'
  | 'underpaid'
  | 'failed';

// Timeline entry
export interface TimelineEntry {
  stage: string;
  timestamp: number;
  details?: string;
}

// Deposit data stored in memory
interface DepositData {
  depositId: string;
  depositAddress: string;
  memo: string;
  expectedAmount: string;
  expectedOutput: string;
  expiresAt: number;
  status: DepositStatusType;
  evmAddress: string;
  quoteId: string;
  btcTxHash?: string;
  receivedAmount?: string;
  timeline: TimelineEntry[];
  createdAt: number;
  estimatedCompletion?: number;
}

// Initiate deposit params
export interface InitiateDepositParams {
  btcAmount: string;
  evmAddress: string;
}

// Initiate deposit result
export interface DepositInstructions {
  depositId: string;
  depositAddress: string;
  memo: string;
  expectedAmount: string;
  expectedOutput: string;
  expiresAt: number;
  status: DepositStatusType;
}

// Confirm deposit params
export interface ConfirmDepositParams {
  depositId: string;
  btcTxHash: string;
  receivedAmount?: string;
}

// Confirm deposit result
export interface ConfirmDepositResult {
  status: DepositStatusType;
  btcTxHash: string;
  expectedAmount?: string;
  receivedAmount?: string;
  action?: string;
}

// Deposit status result
export interface DepositStatusResult {
  depositId: string;
  status: DepositStatusType;
  timeline: TimelineEntry[];
  btcTxHash?: string;
  estimatedCompletion?: number;
  outputTxHash?: string;
  outputAmount?: string;
}

// In-memory deposit storage
const deposits = new Map<string, DepositData>();

// Subscription callbacks
type DepositCallback = (status: DepositStatusResult) => void;

/**
 * Deposit service for orchestrating BTC → WBTC deposits
 */
export const depositService = {
  /**
   * Initiate a new deposit and get deposit instructions
   */
  async initiateDeposit(params: InitiateDepositParams): Promise<DepositInstructions> {
    const { btcAmount, evmAddress } = params;

    // Validate EVM address
    const evmValidation = validateEvmAddress(evmAddress);
    if (!evmValidation.valid) {
      throw new Error(evmValidation.error);
    }

    // Get quote from quote service
    const quote = await quoteService.getDepositQuote({
      btcAmount,
      evmAddress,
    });

    // Generate unique deposit ID
    const depositId = crypto.randomUUID();
    const now = Date.now();

    // Create deposit data
    const depositData: DepositData = {
      depositId,
      depositAddress: quote.depositAddress,
      memo: quote.memo,
      expectedAmount: btcAmount,
      expectedOutput: quote.outputAmount,
      expiresAt: quote.expiresAt,
      status: 'awaiting_deposit',
      evmAddress,
      quoteId: quote.quoteId,
      timeline: [
        {
          stage: 'initiated',
          timestamp: now,
          details: 'Deposit initiated',
        },
      ],
      createdAt: now,
    };

    // Store deposit
    deposits.set(depositId, depositData);

    return {
      depositId,
      depositAddress: quote.depositAddress,
      memo: quote.memo,
      expectedAmount: btcAmount,
      expectedOutput: quote.outputAmount,
      expiresAt: quote.expiresAt,
      status: 'awaiting_deposit',
    };
  },

  /**
   * Confirm a deposit with BTC transaction hash
   */
  async confirmDeposit(params: ConfirmDepositParams): Promise<ConfirmDepositResult> {
    const { depositId, btcTxHash, receivedAmount } = params;

    // Get deposit
    const deposit = deposits.get(depositId);
    if (!deposit) {
      throw new Error('Deposit not found');
    }

    const now = Date.now();

    // Handle underpayment
    if (receivedAmount) {
      const expected = parseFloat(deposit.expectedAmount);
      const received = parseFloat(receivedAmount);

      if (received < expected) {
        deposit.status = 'underpaid';
        deposit.btcTxHash = btcTxHash;
        deposit.receivedAmount = receivedAmount;
        deposit.timeline.push({
          stage: 'underpaid',
          timestamp: now,
          details: `Received ${receivedAmount} BTC, expected ${deposit.expectedAmount} BTC`,
        });

        return {
          status: 'underpaid',
          btcTxHash,
          expectedAmount: deposit.expectedAmount,
          receivedAmount,
          action: 'refund_or_proceed',
        };
      }
    }

    // Update deposit with transaction hash
    deposit.btcTxHash = btcTxHash;
    deposit.status = 'btc_received';
    deposit.receivedAmount = receivedAmount || deposit.expectedAmount;
    deposit.timeline.push({
      stage: 'btc_received',
      timestamp: now,
      details: `BTC transaction detected: ${btcTxHash}`,
    });

    return {
      status: 'btc_received',
      btcTxHash,
    };
  },

  /**
   * Get the current status of a deposit
   */
  async getDepositStatus(depositId: string): Promise<DepositStatusResult> {
    const deposit = deposits.get(depositId);
    if (!deposit) {
      throw new Error('Deposit not found');
    }

    const result: DepositStatusResult = {
      depositId,
      status: deposit.status,
      timeline: deposit.timeline,
      btcTxHash: deposit.btcTxHash,
    };

    // If we have a BTC transaction, check the swap status
    if (deposit.btcTxHash && (deposit.status === 'btc_received' || deposit.status === 'swap_processing')) {
      try {
        const txStatus = await txMonitor.getTransactionStatus(deposit.btcTxHash);

        if (txStatus.estimatedCompletion) {
          result.estimatedCompletion = txStatus.estimatedCompletion;
        }

        if (txStatus.status === 'completed') {
          deposit.status = 'completed';
          result.status = 'completed';
          result.outputTxHash = txStatus.outputTxHash;
          result.outputAmount = txStatus.outputAmount;

          // Add to timeline if not already added
          const hasCompletedEntry = deposit.timeline.some(t => t.stage === 'completed');
          if (!hasCompletedEntry) {
            deposit.timeline.push({
              stage: 'completed',
              timestamp: Date.now(),
              details: `Swap completed. Output: ${txStatus.outputAmount}`,
            });
          }
        } else if (txStatus.status === 'failed') {
          deposit.status = 'failed';
          result.status = 'failed';
        } else if (txStatus.status === 'processing') {
          deposit.status = 'swap_processing';
          result.status = 'swap_processing';
        }
      } catch {
        // If we can't get tx status, just return stored status
      }
    }

    return result;
  },

  /**
   * Get a deposit by ID
   */
  async getDeposit(depositId: string): Promise<DepositData | null> {
    const deposit = deposits.get(depositId);
    if (!deposit) {
      return null;
    }
    return { ...deposit };
  },

  /**
   * Subscribe to deposit status updates
   */
  subscribeToDeposit(depositId: string, callback: DepositCallback): () => void {
    const deposit = deposits.get(depositId);
    if (!deposit || !deposit.btcTxHash) {
      return () => {};
    }

    // Subscribe to transaction monitor for updates
    const unsubscribe = txMonitor.subscribe(deposit.btcTxHash, (txStatus: TransactionStatus) => {
      const now = Date.now();

      // Update deposit status based on transaction status
      if (txStatus.status === 'completed') {
        deposit.status = 'completed';
        const hasCompletedEntry = deposit.timeline.some(t => t.stage === 'completed');
        if (!hasCompletedEntry) {
          deposit.timeline.push({
            stage: 'completed',
            timestamp: now,
            details: `Swap completed. Output: ${txStatus.outputAmount}`,
          });
        }
      } else if (txStatus.status === 'failed') {
        deposit.status = 'failed';
        deposit.timeline.push({
          stage: 'failed',
          timestamp: now,
          details: txStatus.error || 'Transaction failed',
        });
      } else if (txStatus.status === 'processing') {
        deposit.status = 'swap_processing';
      }

      // Call the user callback with updated status
      callback({
        depositId,
        status: deposit.status,
        timeline: deposit.timeline,
        btcTxHash: deposit.btcTxHash,
        outputTxHash: txStatus.outputTxHash,
        outputAmount: txStatus.outputAmount,
        estimatedCompletion: txStatus.estimatedCompletion,
      });
    });

    return unsubscribe;
  },

  /**
   * Clear all deposits (useful for testing)
   */
  clearDeposits(): void {
    deposits.clear();
  },
};
