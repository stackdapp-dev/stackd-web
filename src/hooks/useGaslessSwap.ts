"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/providers/Web3Provider";

interface Quote {
    liquidityAvailable: boolean;
    buyAmount: string;
    buyToken: string;
    sellAmount: string;
    sellToken: string;
    totalNetworkFee?: string;
    trade?: {
        type: string;
        hash: string;
        eip712: {
            domain: Record<string, unknown>;
            types: Record<string, unknown>;
            primaryType: string;
            message: Record<string, unknown>;
        };
    };
    approval?: {
        type: string;
        hash: string;
        eip712: {
            domain: Record<string, unknown>;
            types: Record<string, unknown>;
            primaryType: string;
            message: Record<string, unknown>;
        };
    };
}

interface SwapResult {
    success: boolean;
    tradeHash?: string;
    error?: string;
}

// Parse 0x API errors into user-friendly messages
function parseApiError(errorString: string): string {
    // Try to parse the error message
    if (errorString.includes("SELL_AMOUNT_TOO_SMALL")) {
        // Extract min amount if available
        const minMatch = errorString.match(/minSellAmount["\s:]+(\d+)/);
        if (minMatch) {
            return `Amount too small. Please enter a larger amount to swap.`;
        }
        return "Amount too small. Please enter a larger amount.";
    }

    if (errorString.includes("INSUFFICIENT_ASSET_LIQUIDITY")) {
        return "Not enough liquidity available for this swap. Try a smaller amount.";
    }

    if (errorString.includes("INPUT_INVALID")) {
        return "Invalid swap parameters. Please try again.";
    }

    if (errorString.includes("TAKER_ADDRESS_INVALID")) {
        return "Wallet address issue. Please reconnect your wallet.";
    }

    if (errorString.includes("No liquidity")) {
        return "No liquidity available for this token pair.";
    }

    // Default: return a cleaned up version
    if (errorString.includes("0x API error:")) {
        return "Swap service temporarily unavailable. Please try again.";
    }

    return errorString;
}

export function useGaslessSwap() {
    const { walletClient, activeWalletAddress } = useWeb3();
    const [isLoading, setIsLoading] = useState(false);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get quote for token swap
    const getQuote = useCallback(
        async (
            sellToken: string,
            buyToken: string,
            sellAmount: string
        ): Promise<Quote | null> => {
            if (!sellAmount || parseFloat(sellAmount) === 0 || !activeWalletAddress) {
                setQuote(null);
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    sellToken,
                    buyToken,
                    sellAmount,
                    taker: activeWalletAddress,
                });

                console.log("[0x] Fetching quote:", params.toString());
                const response = await fetch(`/api/0x?${params}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to fetch quote");
                }

                const data: Quote = await response.json();
                console.log("[0x] Quote received:", data);

                if (!data.liquidityAvailable) {
                    throw new Error("No liquidity available for this swap");
                }

                setQuote(data);
                return data;
            } catch (err) {
                const rawError = err instanceof Error ? err.message : "Quote failed";
                const errorMessage = parseApiError(rawError);
                console.error("[0x] Quote error:", err);
                setError(errorMessage);
                setQuote(null);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [activeWalletAddress]
    );

    // Split signature for 0x API format
    const splitSignature = (signature: string) => {
        // Remove 0x prefix
        const sig = signature.slice(2);
        const r = "0x" + sig.slice(0, 64);
        const s = "0x" + sig.slice(64, 128);
        const v = parseInt(sig.slice(128, 130), 16);
        return { r, s, v };
    };

    // Execute the swap
    const executeSwap = useCallback(async (): Promise<SwapResult> => {
        console.log("[0x] executeSwap called");

        if (!quote || !walletClient || !activeWalletAddress) {
            console.log("[0x] Missing requirements:", {
                quote: !!quote,
                walletClient: !!walletClient,
                activeWalletAddress
            });
            return { success: false, error: "Missing requirements for swap" };
        }

        if (!quote.trade) {
            return { success: false, error: "No trade data in quote" };
        }

        setIsLoading(true);
        setError(null);

        try {
            const submitPayload: Record<string, unknown> = {
                chainId: 42161,
            };

            // Sign approval if needed
            if (quote.approval) {
                console.log("[0x] Signing approval...");
                const approvalSignature = await walletClient.signTypedData({
                    account: activeWalletAddress as `0x${string}`,
                    domain: quote.approval.eip712.domain as any,
                    types: quote.approval.eip712.types as any,
                    primaryType: quote.approval.eip712.primaryType,
                    message: quote.approval.eip712.message as any,
                });

                const { r: approvalR, s: approvalS, v: approvalV } = splitSignature(approvalSignature);
                submitPayload.approval = {
                    type: quote.approval.type,
                    eip712: quote.approval.eip712,
                    signature: {
                        r: approvalR,
                        s: approvalS,
                        v: approvalV,
                        signatureType: 2, // EIP-712
                    },
                };
                console.log("[0x] Approval signed");
            }

            // Sign trade
            console.log("[0x] Signing trade...");
            const tradeSignature = await walletClient.signTypedData({
                account: activeWalletAddress as `0x${string}`,
                domain: quote.trade.eip712.domain as any,
                types: quote.trade.eip712.types as any,
                primaryType: quote.trade.eip712.primaryType,
                message: quote.trade.eip712.message as any,
            });

            const { r: tradeR, s: tradeS, v: tradeV } = splitSignature(tradeSignature);
            submitPayload.trade = {
                type: quote.trade.type,
                eip712: quote.trade.eip712,
                signature: {
                    r: tradeR,
                    s: tradeS,
                    v: tradeV,
                    signatureType: 2, // EIP-712
                },
            };
            console.log("[0x] Trade signed");

            // Submit to 0x
            console.log("[0x] Submitting swap...");
            const submitResponse = await fetch("/api/0x", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitPayload),
            });

            if (!submitResponse.ok) {
                const errorData = await submitResponse.json();
                throw new Error(errorData.error || "Failed to submit swap");
            }

            const submitResult = await submitResponse.json();
            console.log("[0x] Swap submitted:", submitResult);

            return {
                success: true,
                tradeHash: submitResult.tradeHash,
            };
        } catch (err) {
            const rawError = err instanceof Error ? err.message : "Swap failed";
            const errorMessage = parseApiError(rawError);
            console.error("[0x] Swap error:", err);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [quote, walletClient, activeWalletAddress]);

    // Get destination amount from quote
    const getDestAmount = useCallback(
        (destDecimals: number): string | null => {
            if (!quote) return null;

            const amount = BigInt(quote.buyAmount);
            const divisor = BigInt(10 ** destDecimals);
            const wholePart = amount / divisor;
            const fractionalPart = amount % divisor;

            const formatted = `${wholePart}.${fractionalPart.toString().padStart(destDecimals, "0")}`;
            // Remove trailing zeros but keep at least 2 decimal places
            return formatted.replace(/(\.\d{2})\d*$/, "$1").replace(/\.?0+$/, "") || formatted;
        },
        [quote]
    );

    return {
        quote,
        isLoading,
        error,
        getQuote,
        executeSwap,
        getDestAmount,
    };
}
