/**
 * Transaction Monitor for THORChain swap transactions
 * Polls Midgard API for status updates and notifies subscribers
 */

const MIDGARD_BASE_URL = 'https://midgard.ninerealms.com/v2';
const POLL_INTERVAL_MS = 10000; // 10 seconds

export type TransactionStage =
  | 'awaiting_confirmation'
  | 'swap_in_progress'
  | 'complete'
  | 'failed'
  | 'not_found';

export type TransactionStatusType =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'not_found';

export interface TransactionStatus {
  status: TransactionStatusType;
  stage: TransactionStage;
  confirmations: number;
  outputTxHash?: string;
  outputAmount?: string;
  error?: string;
  refundTxHash?: string;
  estimatedCompletion?: number;
}

export interface StreamingSwapProgress {
  totalSubSwaps: number;
  completedSubSwaps: number;
  percentComplete: number;
}

interface MidgardAction {
  status: string;
  type?: string;
  in: Array<{
    txID: string;
    confirmationCountIn?: number;
  }>;
  out: Array<{
    txID: string;
    coins?: Array<{
      amount: string;
      asset: string;
    }>;
  }>;
  metadata?: {
    swap?: {
      streamingSwapMeta?: {
        count: number;
        quantity: number;
      };
    };
    refund?: {
      reason: string;
    };
  };
}

interface MidgardResponse {
  actions: MidgardAction[];
}

type StatusCallback = (status: TransactionStatus) => void;

class TransactionMonitor {
  private async fetchAction(txHash: string): Promise<MidgardAction | null> {
    try {
      const response = await fetch(`${MIDGARD_BASE_URL}/actions?txid=${txHash}`);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = (await response.json()) as MidgardResponse;

      if (data.actions.length === 0) {
        return null;
      }

      return data.actions[0];
    } catch (error) {
      throw new Error(
        `Failed to fetch transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private parseActionToStatus(action: MidgardAction | null): TransactionStatus {
    // Not found
    if (!action) {
      return {
        status: 'not_found',
        stage: 'not_found',
        confirmations: 0,
      };
    }

    const confirmations = action.in[0]?.confirmationCountIn ?? 0;
    const hasOutput = action.out.length > 0 && action.out[0]?.txID;

    // Check for refund (failed)
    if (action.type === 'refund') {
      return {
        status: 'failed',
        stage: 'failed',
        confirmations,
        error: action.metadata?.refund?.reason,
        refundTxHash: action.out[0]?.txID,
      };
    }

    // Check if pending
    if (action.status === 'pending') {
      return {
        status: 'pending',
        stage: 'awaiting_confirmation',
        confirmations,
      };
    }

    // Check for streaming swap in progress
    const streamingMeta = action.metadata?.swap?.streamingSwapMeta;
    if (streamingMeta && streamingMeta.count < streamingMeta.quantity) {
      return {
        status: 'processing',
        stage: 'swap_in_progress',
        confirmations,
      };
    }

    // Check for swap in progress (no output yet)
    if (action.type === 'swap' && !hasOutput) {
      return {
        status: 'processing',
        stage: 'swap_in_progress',
        confirmations,
      };
    }

    // Completed swap with output
    if (action.type === 'swap' && hasOutput) {
      const outputCoin = action.out[0]?.coins?.[0];
      return {
        status: 'completed',
        stage: 'complete',
        confirmations,
        outputTxHash: action.out[0]?.txID,
        outputAmount: outputCoin?.amount,
      };
    }

    // Default to processing if we can't determine exact state
    return {
      status: 'processing',
      stage: 'swap_in_progress',
      confirmations,
    };
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    const action = await this.fetchAction(txHash);
    return this.parseActionToStatus(action);
  }

  subscribe(txHash: string, callback: StatusCallback): () => void {
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (!isActive) return;

      try {
        const status = await this.getTransactionStatus(txHash);
        if (!isActive) return;

        callback(status);

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          isActive = false;
          return;
        }

        // Schedule next poll
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        // Continue polling on error
        if (isActive) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    // Schedule first poll after interval
    timeoutId = setTimeout(poll, POLL_INTERVAL_MS);

    // Return unsubscribe function
    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }

  async getStreamingSwapProgress(txHash: string): Promise<StreamingSwapProgress | null> {
    const action = await this.fetchAction(txHash);

    if (!action) {
      return null;
    }

    const streamingMeta = action.metadata?.swap?.streamingSwapMeta;
    if (!streamingMeta) {
      return null;
    }

    const { count, quantity } = streamingMeta;
    return {
      totalSubSwaps: quantity,
      completedSubSwaps: count,
      percentComplete: Math.round((count / quantity) * 100),
    };
  }
}

// Export singleton instance
export const txMonitor = new TransactionMonitor();
