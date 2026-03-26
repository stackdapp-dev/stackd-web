"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { formatTokenAmount } from "@/lib/utils";

interface Quote {
    provider?: string; // Which swap provider returned this quote
    liquidityAvailable: boolean;
    buyAmount: string;
    buyToken: string;
    sellAmount: string;
    sellToken: string;
    totalNetworkFee?: string;
    configuredProviders?: string[]; // Available providers for failover
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
    provider?: string; // Which provider executed the swap
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

    // Rate limiting
    if (errorString.includes("429") || errorString.includes("rate limit")) {
        return "Too many requests. Please wait a moment and try again.";
    }

    // Token not supported
    if (errorString.includes("TOKEN_NOT_SUPPORTED") || errorString.includes("not supported")) {
        return "This token pair is not supported for gasless swaps.";
    }

    // Gasless not available
    if (errorString.includes("GASLESS_NOT_AVAILABLE") || errorString.includes("gasless")) {
        return "Gasless swaps are temporarily unavailable. Please try again later.";
    }

    // Network issues
    if (errorString.includes("503") || errorString.includes("502") || errorString.includes("504")) {
        return "Swap service is temporarily unavailable. Please try again.";
    }

    // Try to extract error details from 0x API response
    if (errorString.includes("0x API error:")) {
        // Try to parse JSON error from the response
        const jsonMatch = errorString.match(/\{.*\}/);
        if (jsonMatch) {
            try {
                const errorData = JSON.parse(jsonMatch[0]);
                if (errorData.reason) {
                    return errorData.reason;
                }
                if (errorData.description) {
                    return errorData.description;
                }
            } catch {
                // Not JSON, continue
            }
        }
        // Extract status code
        const statusMatch = errorString.match(/0x API error: (\d+)/);
        if (statusMatch) {
            const status = parseInt(statusMatch[1]);
            if (status === 400) {
                return "Invalid swap request. Please check your input.";
            }
            if (status === 403) {
                return "Swap service access denied. Please try again later.";
            }
        }
        return "Swap service temporarily unavailable. Please try again.";
    }

    return errorString;
}

export function useGaslessSwap(chainId: number = 42161, maxSlippagePct: number = 1.0) {
    const { walletClient, activeWalletAddress, switchToNetwork } = useWeb3();
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
                    chainId: chainId.toString(),
                });

                console.log("[Swap] Fetching quote:", params.toString());
                const response = await fetch(`/api/swap?${params}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to fetch quote");
                }

                const data: Quote = await response.json();
                console.log("[Swap] Quote received from", data.provider, ":", data);

                if (!data.liquidityAvailable) {
                    throw new Error("No liquidity available for this swap");
                }

                setQuote(data);
                return data;
            } catch (err) {
                const rawError = err instanceof Error ? err.message : "Quote failed";
                const errorMessage = parseApiError(rawError);
                console.error("[Swap] Quote error:", err);
                setError(errorMessage);
                setQuote(null);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [activeWalletAddress, chainId]
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
            // Ensure wallet is on the correct network before signing
            // This fixes the "chainId should be same as current chainId" error
            // when external wallets are connected to a different network
            console.log("[0x] Ensuring correct network for chain", chainId, "...");
            await switchToNetwork(chainId);
            console.log("[0x] Network check passed");

            // CRITICAL: Fetch a fresh quote right before signing
            // 0x gasless quotes expire in ~30 seconds, so we need to ensure we're using a fresh one
            console.log("[0x] Fetching fresh quote before signing...");
            const params = new URLSearchParams({
                sellToken: quote.sellToken,
                buyToken: quote.buyToken,
                sellAmount: quote.sellAmount,
                taker: activeWalletAddress,
                chainId: chainId.toString(),
            });

            const freshQuoteResponse = await fetch(`/api/0x?${params}`);
            if (!freshQuoteResponse.ok) {
                const errorData = await freshQuoteResponse.json();
                throw new Error(errorData.error || "Failed to fetch fresh quote");
            }

            const freshQuote: Quote = await freshQuoteResponse.json();
            console.log("[0x] Fresh quote received");

            if (!freshQuote.liquidityAvailable) {
                throw new Error("No liquidity available for this swap");
            }

            if (!freshQuote.trade) {
                throw new Error("No trade data in fresh quote");
            }

            // Slippage guard: reject if fresh quote deviates too much from original
            const originalBuy = parseFloat(quote.buyAmount);
            const freshBuy = parseFloat(freshQuote.buyAmount);
            if (originalBuy > 0 && freshBuy > 0) {
                const slippagePct = ((originalBuy - freshBuy) / originalBuy) * 100;
                console.log(`[Swap] Slippage check: original=${originalBuy}, fresh=${freshBuy}, slippage=${slippagePct.toFixed(2)}%, max=${maxSlippagePct}%`);
                if (slippagePct > maxSlippagePct) {
                    throw new Error(`Price moved ${slippagePct.toFixed(2)}% which exceeds your max slippage of ${maxSlippagePct}%. Try again or increase slippage tolerance.`);
                }
            }

            const submitPayload: Record<string, unknown> = {
                chainId,
            };

            // Sign approval if needed (using fresh quote data)
            if (freshQuote.approval) {
                console.log("[0x] Signing approval...");
                const approvalSignature = await walletClient.signTypedData({
                    account: activeWalletAddress as `0x${string}`,
                    domain: freshQuote.approval.eip712.domain as any,
                    types: freshQuote.approval.eip712.types as any,
                    primaryType: freshQuote.approval.eip712.primaryType,
                    message: freshQuote.approval.eip712.message as any,
                });

                const { r: approvalR, s: approvalS, v: approvalV } = splitSignature(approvalSignature);
                submitPayload.approval = {
                    type: freshQuote.approval.type,
                    eip712: freshQuote.approval.eip712,
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
                domain: freshQuote.trade.eip712.domain as any,
                types: freshQuote.trade.eip712.types as any,
                primaryType: freshQuote.trade.eip712.primaryType,
                message: freshQuote.trade.eip712.message as any,
            });

            const { r: tradeR, s: tradeS, v: tradeV } = splitSignature(tradeSignature);
            submitPayload.trade = {
                type: freshQuote.trade.type,
                eip712: freshQuote.trade.eip712,
                signature: {
                    r: tradeR,
                    s: tradeS,
                    v: tradeV,
                    signatureType: 2, // EIP-712
                },
            };
            console.log("[0x] Trade signed");

            // Submit to swap aggregator
            console.log("[Swap] Submitting swap via", freshQuote.provider || "0x", "...");
            const submitResponse = await fetch("/api/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...submitPayload,
                    provider: freshQuote.provider || "0x",
                }),
            });

            if (!submitResponse.ok) {
                const errorData = await submitResponse.json();
                throw new Error(errorData.error || "Failed to submit swap");
            }

            const submitResult = await submitResponse.json();
            console.log("[Swap] Swap submitted via", submitResult.provider || freshQuote.provider, ":", submitResult);

            return {
                success: true,
                tradeHash: submitResult.tradeHash,
                provider: submitResult.provider || freshQuote.provider,
            };
        } catch (err) {
            const rawError = err instanceof Error ? err.message : "Swap failed";
            const errorMessage = parseApiError(rawError);
            console.error("[Swap] Swap error:", err);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [quote, walletClient, activeWalletAddress, switchToNetwork, chainId, maxSlippagePct]);

    // Get destination amount from quote
    const getDestAmount = useCallback(
        (destDecimals: number): string | null => {
            if (!quote) return null;
            return formatTokenAmount(quote.buyAmount, destDecimals);
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
        configuredProviders: quote?.configuredProviders || [],
    };
}
