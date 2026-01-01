/**
 * Withdrawal Service for WBTC → BTC flow
 * Orchestrates approval checks, swap execution, and status tracking
 */

import { quoteService } from './quoteService';
import { txMonitor } from './txMonitor';
import { validateBtcAddress, validateEvmAddress } from './addressValidator';

// Withdrawal status flow:
// pending_approval → ready_to_swap → swap_submitted → swap_processing → completed
//                                                                      ↘ failed

export type WithdrawalStatus =
  | 'pending_approval'
  | 'ready_to_swap'
  | 'swap_submitted'
  | 'swap_processing'
  | 'completed'
  | 'failed';

export interface InitiateWithdrawalParams {
  wbtcAmount: string;
  btcAddress: string;
  evmAddress: string;
}

export interface ApprovalTx {
  to: string;
  data: string;
  value: string;
}

export interface WithdrawalDetails {
  withdrawalId: string;
  inputAmount: string;
  expectedOutput: string;
  btcAddress: string;
  evmAddress: string;
  approvalTx: ApprovalTx | null;
  status: WithdrawalStatus;
  quoteId: string;
  estimatedTime: number;
  createdAt: number;
}

export interface ConfirmApprovalParams {
  withdrawalId: string;
  approvalTxHash: string;
}

export interface ConfirmApprovalResult {
  withdrawalId: string;
  status: WithdrawalStatus;
  approvalTxHash: string;
}

export interface ExecuteWithdrawalParams {
  withdrawalId: string;
  swapTxHash: string;
}

export interface ExecuteWithdrawalResult {
  withdrawalId: string;
  status: WithdrawalStatus;
  swapTxHash: string;
}

export interface TimelineEntry {
  status: WithdrawalStatus;
  timestamp: number;
  txHash?: string;
}

export interface WithdrawalStatusResult {
  withdrawalId: string;
  status: WithdrawalStatus;
  inputAmount: string;
  expectedOutput: string;
  btcAddress: string;
  evmAddress: string;
  approvalTxHash?: string;
  swapTxHash?: string;
  btcTxHash?: string;
  timeline: TimelineEntry[];
  error?: string;
}

// In-memory storage for withdrawals
interface StoredWithdrawal extends WithdrawalDetails {
  approvalTxHash?: string;
  swapTxHash?: string;
  btcTxHash?: string;
  timeline: TimelineEntry[];
  error?: string;
}

const withdrawals = new Map<string, StoredWithdrawal>();

// THORChain router address for WBTC approval
const THORCHAIN_ROUTER = '0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146';

/**
 * Generate approval transaction data for WBTC
 */
function generateApprovalTx(): ApprovalTx {
  // ERC20 approve function selector: approve(address,uint256)
  const functionSelector = '0x095ea7b3';
  // Pad router address to 32 bytes (remove 0x, pad to 64 chars)
  const paddedAddress = THORCHAIN_ROUTER.slice(2).toLowerCase().padStart(64, '0');
  // Use max uint256 for infinite approval
  const maxUint256 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

  return {
    to: '0x2f2a2543B76A4166549F7aaB2e75Bef0aeFc5B0f', // WBTC on Arbitrum
    data: `${functionSelector}${paddedAddress}${maxUint256}`,
    value: '0x0',
  };
}

/**
 * Withdrawal service for WBTC to BTC swaps
 */
export const withdrawalService = {
  /**
   * Initiate a withdrawal by getting a quote and checking approval status
   */
  async initiateWithdrawal(params: InitiateWithdrawalParams): Promise<WithdrawalDetails> {
    const { wbtcAmount, btcAddress, evmAddress } = params;

    // Validate BTC address
    const btcValidation = validateBtcAddress(btcAddress);
    if (!btcValidation.valid) {
      throw new Error(btcValidation.error);
    }

    // Check for testnet addresses
    if (btcValidation.network === 'testnet') {
      throw new Error('Testnet addresses not supported');
    }

    // Validate EVM address
    const evmValidation = validateEvmAddress(evmAddress);
    if (!evmValidation.valid) {
      throw new Error(evmValidation.error);
    }

    // Get withdrawal quote
    const quote = await quoteService.getWithdrawalQuote({
      wbtcAmount,
      btcAddress,
      evmAddress,
    });

    // Generate unique withdrawal ID
    const withdrawalId = crypto.randomUUID();

    // Determine status based on approval requirement
    const status: WithdrawalStatus = quote.approvalRequired ? 'pending_approval' : 'ready_to_swap';
    const approvalTx = quote.approvalRequired ? generateApprovalTx() : null;

    const now = Date.now();

    // Create withdrawal record
    const withdrawal: StoredWithdrawal = {
      withdrawalId,
      inputAmount: wbtcAmount,
      expectedOutput: quote.outputAmount,
      btcAddress,
      evmAddress,
      approvalTx,
      status,
      quoteId: quote.quoteId,
      estimatedTime: quote.estimatedTime,
      createdAt: now,
      timeline: [{ status, timestamp: now }],
    };

    // Store withdrawal
    withdrawals.set(withdrawalId, withdrawal);

    return {
      withdrawalId,
      inputAmount: wbtcAmount,
      expectedOutput: quote.outputAmount,
      btcAddress,
      evmAddress,
      approvalTx,
      status,
      quoteId: quote.quoteId,
      estimatedTime: quote.estimatedTime,
      createdAt: now,
    };
  },

  /**
   * Confirm that approval transaction has been submitted
   */
  async confirmApproval(params: ConfirmApprovalParams): Promise<ConfirmApprovalResult> {
    const { withdrawalId, approvalTxHash } = params;

    const withdrawal = withdrawals.get(withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // Update status
    const now = Date.now();
    withdrawal.status = 'ready_to_swap';
    withdrawal.approvalTxHash = approvalTxHash;
    withdrawal.timeline.push({ status: 'ready_to_swap', timestamp: now, txHash: approvalTxHash });

    return {
      withdrawalId,
      status: 'ready_to_swap',
      approvalTxHash,
    };
  },

  /**
   * Execute the withdrawal swap after approval is confirmed
   */
  async executeWithdrawal(params: ExecuteWithdrawalParams): Promise<ExecuteWithdrawalResult> {
    const { withdrawalId, swapTxHash } = params;

    const withdrawal = withdrawals.get(withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // Check if ready to swap
    if (withdrawal.status !== 'ready_to_swap') {
      throw new Error('Withdrawal not ready');
    }

    // Update status
    const now = Date.now();
    withdrawal.status = 'swap_submitted';
    withdrawal.swapTxHash = swapTxHash;
    withdrawal.timeline.push({ status: 'swap_submitted', timestamp: now, txHash: swapTxHash });

    return {
      withdrawalId,
      status: 'swap_submitted',
      swapTxHash,
    };
  },

  /**
   * Get the current status of a withdrawal
   */
  async getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalStatusResult> {
    const withdrawal = withdrawals.get(withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // If swap is submitted, check transaction status
    if (withdrawal.swapTxHash && (withdrawal.status === 'swap_submitted' || withdrawal.status === 'swap_processing')) {
      const txStatus = await txMonitor.getTransactionStatus(withdrawal.swapTxHash);

      if (txStatus.status === 'completed' && txStatus.outputTxHash) {
        withdrawal.status = 'completed';
        withdrawal.btcTxHash = txStatus.outputTxHash;
        withdrawal.timeline.push({
          status: 'completed',
          timestamp: Date.now(),
          txHash: txStatus.outputTxHash
        });
      } else if (txStatus.status === 'failed') {
        withdrawal.status = 'failed';
        withdrawal.error = txStatus.error;
        withdrawal.timeline.push({ status: 'failed', timestamp: Date.now() });
      } else if (txStatus.status === 'processing') {
        withdrawal.status = 'swap_processing';
        // Only add to timeline if status changed
        const lastStatus = withdrawal.timeline[withdrawal.timeline.length - 1]?.status;
        if (lastStatus !== 'swap_processing') {
          withdrawal.timeline.push({ status: 'swap_processing', timestamp: Date.now() });
        }
      }
    }

    return {
      withdrawalId,
      status: withdrawal.status,
      inputAmount: withdrawal.inputAmount,
      expectedOutput: withdrawal.expectedOutput,
      btcAddress: withdrawal.btcAddress,
      evmAddress: withdrawal.evmAddress,
      approvalTxHash: withdrawal.approvalTxHash,
      swapTxHash: withdrawal.swapTxHash,
      btcTxHash: withdrawal.btcTxHash,
      timeline: withdrawal.timeline,
      error: withdrawal.error,
    };
  },

  /**
   * Clear all withdrawals (useful for testing)
   */
  clearWithdrawals(): void {
    withdrawals.clear();
  },
};
