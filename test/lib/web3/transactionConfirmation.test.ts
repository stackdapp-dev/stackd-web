/**
 * TDD tests for transaction confirmation utility
 *
 * Bug fixes:
 * 1. WBTC loan approval fails because we don't wait for approval tx confirmation
 * 2. XAUT loan shows failure but succeeds because AbortError is thrown after tx is sent
 *
 * Solution: Add "Confirming transaction..." state that:
 * - Waits for transaction to be confirmed on-chain
 * - Handles AbortError by checking actual transaction status
 * - Returns the actual result based on on-chain status
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Hash, PublicClient, TransactionReceipt } from "viem";

// Mock types for testing
type TransactionStatus = "success" | "reverted" | "pending" | "not_found";

interface ConfirmTransactionResult {
    status: TransactionStatus;
    receipt: TransactionReceipt | null;
    error: string | null;
}

// We'll implement this utility
// import { confirmTransaction } from "@/lib/web3/transactionConfirmation";

describe("confirmTransaction", () => {
    // Mock public client
    const createMockPublicClient = (options: {
        receiptStatus?: "success" | "reverted";
        shouldThrow?: boolean;
        throwAfterMs?: number;
    } = {}) => {
        return {
            waitForTransactionReceipt: vi.fn().mockImplementation(async () => {
                if (options.throwAfterMs) {
                    await new Promise(resolve => setTimeout(resolve, options.throwAfterMs));
                }
                if (options.shouldThrow) {
                    throw new Error("Transaction not found");
                }
                return {
                    status: options.receiptStatus ?? "success",
                    transactionHash: "0x123" as Hash,
                    blockNumber: BigInt(12345),
                    blockHash: "0xblock" as Hash,
                } as TransactionReceipt;
            }),
            getTransactionReceipt: vi.fn().mockImplementation(async () => {
                if (options.shouldThrow) {
                    return null;
                }
                return {
                    status: options.receiptStatus ?? "success",
                    transactionHash: "0x123" as Hash,
                    blockNumber: BigInt(12345),
                    blockHash: "0xblock" as Hash,
                } as TransactionReceipt;
            }),
        } as unknown as PublicClient;
    };

    describe("successful transactions", () => {
        it("should return success when transaction is confirmed", async () => {
            const { confirmTransaction } = await import("@/lib/web3/transactionConfirmation");
            const mockClient = createMockPublicClient({ receiptStatus: "success" });
            const txHash = "0x1234567890abcdef" as Hash;

            const result = await confirmTransaction(mockClient, txHash);

            expect(result.status).toBe("success");
            expect(result.receipt).not.toBeNull();
            expect(result.error).toBeNull();
        });

        it("should call waitForTransactionReceipt with correct hash", async () => {
            const { confirmTransaction } = await import("@/lib/web3/transactionConfirmation");
            const mockClient = createMockPublicClient({ receiptStatus: "success" });
            const txHash = "0xabcdef1234567890" as Hash;

            await confirmTransaction(mockClient, txHash);

            expect(mockClient.waitForTransactionReceipt).toHaveBeenCalledWith(
                expect.objectContaining({ hash: txHash })
            );
        });
    });

    describe("reverted transactions", () => {
        it("should return reverted status when transaction fails on-chain", async () => {
            const { confirmTransaction } = await import("@/lib/web3/transactionConfirmation");
            const mockClient = createMockPublicClient({ receiptStatus: "reverted" });
            const txHash = "0x123" as Hash;

            const result = await confirmTransaction(mockClient, txHash);

            expect(result.status).toBe("reverted");
            expect(result.receipt).not.toBeNull();
            expect(result.error).toContain("reverted");
        });
    });

    describe("error handling", () => {
        it("should handle transaction not found gracefully", async () => {
            const { confirmTransaction } = await import("@/lib/web3/transactionConfirmation");
            const mockClient = createMockPublicClient({ shouldThrow: true });
            const txHash = "0x123" as Hash;

            const result = await confirmTransaction(mockClient, txHash);

            expect(result.status).toBe("not_found");
            expect(result.receipt).toBeNull();
            expect(result.error).not.toBeNull();
        });

        it("should return not_found for null/undefined hash", async () => {
            const { confirmTransaction } = await import("@/lib/web3/transactionConfirmation");
            const mockClient = createMockPublicClient();

            const result = await confirmTransaction(mockClient, null as unknown as Hash);

            expect(result.status).toBe("not_found");
            expect(result.error).toContain("hash");
        });
    });

    describe("timeout handling", () => {
        it("should respect timeout parameter", async () => {
            const { confirmTransaction } = await import("@/lib/web3/transactionConfirmation");
            const mockClient = createMockPublicClient({ receiptStatus: "success" });
            const txHash = "0x123" as Hash;

            const result = await confirmTransaction(mockClient, txHash, { timeout: 5000 });

            expect(result.status).toBe("success");
            expect(mockClient.waitForTransactionReceipt).toHaveBeenCalledWith(
                expect.objectContaining({ timeout: 5000 })
            );
        });
    });
});

describe("checkTransactionStatus", () => {
    /**
     * This function checks the status of a transaction that may have been sent
     * but whose confirmation we missed (e.g., due to AbortError).
     *
     * Used for XAUT loans where Privy throws AbortError but tx actually succeeds.
     */
    const createMockPublicClient = (receipt: TransactionReceipt | null) => {
        return {
            getTransactionReceipt: vi.fn().mockResolvedValue(receipt),
        } as unknown as PublicClient;
    };

    it("should return success if transaction receipt shows success", async () => {
        const { checkTransactionStatus } = await import("@/lib/web3/transactionConfirmation");
        const mockReceipt = {
            status: "success",
            transactionHash: "0x123" as Hash,
            blockNumber: BigInt(12345),
        } as TransactionReceipt;
        const mockClient = createMockPublicClient(mockReceipt);

        const result = await checkTransactionStatus(mockClient, "0x123" as Hash);

        expect(result.status).toBe("success");
        expect(result.receipt).toEqual(mockReceipt);
    });

    it("should return reverted if transaction receipt shows reverted", async () => {
        const { checkTransactionStatus } = await import("@/lib/web3/transactionConfirmation");
        const mockReceipt = {
            status: "reverted",
            transactionHash: "0x123" as Hash,
            blockNumber: BigInt(12345),
        } as TransactionReceipt;
        const mockClient = createMockPublicClient(mockReceipt);

        const result = await checkTransactionStatus(mockClient, "0x123" as Hash);

        expect(result.status).toBe("reverted");
    });

    it("should return pending if no receipt found (transaction still pending)", async () => {
        const { checkTransactionStatus } = await import("@/lib/web3/transactionConfirmation");
        const mockClient = createMockPublicClient(null);

        const result = await checkTransactionStatus(mockClient, "0x123" as Hash);

        expect(result.status).toBe("pending");
        expect(result.receipt).toBeNull();
    });

    it("should return not_found for invalid hash", async () => {
        const { checkTransactionStatus } = await import("@/lib/web3/transactionConfirmation");
        const mockClient = createMockPublicClient(null);

        const result = await checkTransactionStatus(mockClient, null as unknown as Hash);

        expect(result.status).toBe("not_found");
    });
});

describe("isAbortError", () => {
    /**
     * Helper to detect AbortError which Privy throws sometimes
     * even when transaction succeeds.
     */
    it("should return true for AbortError", async () => {
        const { isAbortError } = await import("@/lib/web3/transactionConfirmation");

        const abortError = new Error("The operation was aborted.");
        abortError.name = "AbortError";

        expect(isAbortError(abortError)).toBe(true);
    });

    it("should return true for error message containing 'aborted'", async () => {
        const { isAbortError } = await import("@/lib/web3/transactionConfirmation");

        const error = new Error("AbortError: The operation was aborted");

        expect(isAbortError(error)).toBe(true);
    });

    it("should return false for other errors", async () => {
        const { isAbortError } = await import("@/lib/web3/transactionConfirmation");

        const error = new Error("Network error");

        expect(isAbortError(error)).toBe(false);
    });

    it("should return false for non-Error objects", async () => {
        const { isAbortError } = await import("@/lib/web3/transactionConfirmation");

        expect(isAbortError("aborted")).toBe(false);
        expect(isAbortError(null)).toBe(false);
        expect(isAbortError(undefined)).toBe(false);
    });
});
