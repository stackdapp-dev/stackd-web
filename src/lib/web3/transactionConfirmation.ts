/**
 * Transaction Confirmation Utility
 *
 * Provides functions to wait for and check transaction confirmation status.
 *
 * Used to fix:
 * 1. WBTC loan approval - wait for approval tx to be confirmed before proceeding
 * 2. XAUT loan AbortError - check actual tx status when Privy throws abort error
 */
import type { Hash, PublicClient, TransactionReceipt } from "viem";

export type TransactionStatus = "success" | "reverted" | "pending" | "not_found";

export interface ConfirmTransactionResult {
    status: TransactionStatus;
    receipt: TransactionReceipt | null;
    error: string | null;
}

export interface ConfirmTransactionOptions {
    /** Timeout in milliseconds (default: 60000 = 60s) */
    timeout?: number;
    /** Number of confirmations to wait for (default: 1) */
    confirmations?: number;
}

/**
 * Wait for a transaction to be confirmed on-chain.
 *
 * @param publicClient - The viem PublicClient to use
 * @param txHash - The transaction hash to wait for
 * @param options - Optional configuration
 * @returns The confirmation result with status and receipt
 */
export async function confirmTransaction(
    publicClient: PublicClient,
    txHash: Hash | null | undefined,
    options: ConfirmTransactionOptions = {}
): Promise<ConfirmTransactionResult> {
    // Validate hash
    if (!txHash) {
        return {
            status: "not_found",
            receipt: null,
            error: "Invalid transaction hash: hash is null or undefined",
        };
    }

    const { timeout = 60000, confirmations = 1 } = options;

    try {
        console.log("[TX CONFIRM] Waiting for transaction confirmation:", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
            timeout,
            confirmations,
        });

        console.log("[TX CONFIRM] Transaction confirmed:", {
            hash: txHash,
            status: receipt.status,
            blockNumber: receipt.blockNumber?.toString(),
        });

        if (receipt.status === "reverted") {
            return {
                status: "reverted",
                receipt,
                error: "Transaction reverted on-chain",
            };
        }

        return {
            status: "success",
            receipt,
            error: null,
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[TX CONFIRM] Error waiting for confirmation:", err);

        return {
            status: "not_found",
            receipt: null,
            error: errorMessage,
        };
    }
}

/**
 * Check the current status of a transaction without waiting.
 *
 * Useful for checking if a transaction succeeded after an AbortError,
 * since the transaction may have been submitted before the abort.
 *
 * @param publicClient - The viem PublicClient to use
 * @param txHash - The transaction hash to check
 * @returns The transaction status and receipt if found
 */
export async function checkTransactionStatus(
    publicClient: PublicClient,
    txHash: Hash | null | undefined
): Promise<ConfirmTransactionResult> {
    // Validate hash
    if (!txHash) {
        return {
            status: "not_found",
            receipt: null,
            error: "Invalid transaction hash: hash is null or undefined",
        };
    }

    try {
        console.log("[TX CHECK] Checking transaction status:", txHash);

        const receipt = await publicClient.getTransactionReceipt({
            hash: txHash,
        });

        if (!receipt) {
            // Transaction is still pending (not yet mined)
            console.log("[TX CHECK] Transaction still pending:", txHash);
            return {
                status: "pending",
                receipt: null,
                error: null,
            };
        }

        console.log("[TX CHECK] Transaction found:", {
            hash: txHash,
            status: receipt.status,
            blockNumber: receipt.blockNumber?.toString(),
        });

        if (receipt.status === "reverted") {
            return {
                status: "reverted",
                receipt,
                error: "Transaction reverted on-chain",
            };
        }

        return {
            status: "success",
            receipt,
            error: null,
        };
    } catch (err) {
        // If we get an error, the transaction might not exist yet (pending)
        console.log("[TX CHECK] Could not get receipt (may be pending):", txHash);
        return {
            status: "pending",
            receipt: null,
            error: null,
        };
    }
}

/**
 * Check if an error is an AbortError.
 *
 * Privy sometimes throws AbortError even when the transaction was submitted
 * successfully. This helper identifies such errors so we can check the
 * actual transaction status instead of failing immediately.
 *
 * @param error - The error to check
 * @returns True if this is an AbortError
 */
export function isAbortError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    // Check error name
    if (error.name === "AbortError") {
        return true;
    }

    // Check error message
    const message = error.message.toLowerCase();
    if (message.includes("abort") || message.includes("aborted")) {
        return true;
    }

    return false;
}

/**
 * Wait for transaction with AbortError recovery.
 *
 * This is a higher-level function that:
 * 1. Sends a transaction and waits for confirmation
 * 2. If an AbortError occurs but we have a hash, checks the actual status
 * 3. Returns the true status of the transaction
 *
 * @param publicClient - The viem PublicClient to use
 * @param sendFn - Function that sends the transaction and returns hash or error
 * @param options - Optional configuration
 * @returns The confirmation result
 */
export async function sendAndConfirmTransaction(
    publicClient: PublicClient,
    sendFn: () => Promise<{ hash: string | null; error: string | null }>,
    options: ConfirmTransactionOptions = {}
): Promise<ConfirmTransactionResult & { hash: string | null }> {
    let txHash: string | null = null;

    try {
        // Send the transaction
        const result = await sendFn();
        txHash = result.hash;

        if (result.error) {
            // Check if this is an AbortError and we have a hash
            if (isAbortError(new Error(result.error)) && txHash) {
                console.log("[TX SEND] AbortError with hash, checking actual status...");
                const status = await checkTransactionStatus(publicClient, txHash as Hash);
                return { ...status, hash: txHash };
            }

            return {
                status: "not_found",
                receipt: null,
                error: result.error,
                hash: txHash,
            };
        }

        if (!txHash) {
            return {
                status: "not_found",
                receipt: null,
                error: "No transaction hash returned",
                hash: null,
            };
        }

        // Wait for confirmation
        const confirmResult = await confirmTransaction(publicClient, txHash as Hash, options);
        return { ...confirmResult, hash: txHash };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        // If we have a hash and got an AbortError, check the actual status
        if (isAbortError(err) && txHash) {
            console.log("[TX SEND] AbortError caught with hash, checking actual status...");
            const status = await checkTransactionStatus(publicClient, txHash as Hash);
            return { ...status, hash: txHash };
        }

        return {
            status: "not_found",
            receipt: null,
            error: errorMessage,
            hash: txHash,
        };
    }
}
