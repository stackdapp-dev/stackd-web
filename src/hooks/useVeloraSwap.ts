"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { parseSignature, signatureToCompactSignature, compactSignatureToHex } from "viem";

const ARBITRUM_CHAIN_ID = 42161;

interface Quote {
    delta?: {
        destAmount: string;
        srcAmount: string;
        destUSD: string;
        srcUSD: string;
        gasCostUSD?: string;
        partner?: string;
    };
    market?: {
        destAmount: string;
        srcAmount: string;
        destUSD: string;
        srcUSD: string;
        gasCostUSD?: string;
    };
    fallbackReason?: {
        errorType: string;
        details: string;
    };
}

interface SwapResult {
    success: boolean;
    orderId?: string;
    error?: string;
}

export function useVeloraSwap() {
    const { walletClient, activeWalletAddress } = useWeb3();
    const [isLoading, setIsLoading] = useState(false);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get quote for token swap
    const getQuote = useCallback(
        async (
            srcToken: string,
            destToken: string,
            amount: string
        ): Promise<Quote | null> => {
            if (!amount || parseFloat(amount) === 0) {
                setQuote(null);
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    srcToken,
                    destToken,
                    amount,
                    side: "SELL",
                });

                if (activeWalletAddress) {
                    params.append("userAddress", activeWalletAddress);
                }

                const response = await fetch(`/api/velora?${params}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch quote");
                }

                const data: Quote = await response.json();
                setQuote(data);
                return data;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Quote failed";
                setError(errorMessage);
                setQuote(null);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [activeWalletAddress]
    );

    // Execute the swap
    const executeSwap = useCallback(async (): Promise<SwapResult> => {
        console.log("[Velora] executeSwap called, quote:", quote);

        if (!quote || !walletClient || !activeWalletAddress) {
            console.log("[Velora] Missing requirements:", { quote: !!quote, walletClient: !!walletClient, activeWalletAddress });
            return { success: false, error: "Missing requirements for swap" };
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if delta pricing is available
            if (quote.delta) {
                console.log("[Velora] Using Delta pricing (gasless)...");
                const price = quote.delta;

                // Step 1: Build the order
                console.log("[Velora] Building order...");
                const buildResponse = await fetch("/api/velora", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "build",
                        price,
                        chainId: ARBITRUM_CHAIN_ID,
                        owner: activeWalletAddress,
                    }),
                });

                if (!buildResponse.ok) {
                    const errorText = await buildResponse.text();
                    console.error("[Velora] Build failed:", errorText);
                    throw new Error("Failed to build order");
                }

                const builtOrder = await buildResponse.json();
                console.log("[Velora] Order built:", builtOrder);

                // Step 2: Sign the order using EIP-712
                console.log("[Velora] Signing order...");
                const signature = await walletClient.signTypedData({
                    account: activeWalletAddress as `0x${string}`,
                    domain: builtOrder.domain,
                    types: builtOrder.types,
                    primaryType: "Order",
                    message: builtOrder.value,
                });

                // Compact the signature using viem
                const parsedSig = parseSignature(signature);
                const compactSig = signatureToCompactSignature(parsedSig);
                const compactSignature = compactSignatureToHex(compactSig);
                console.log("[Velora] Signature compact:", compactSignature);

                // Step 3: Submit the order
                console.log("[Velora] Submitting order...");
                const submitResponse = await fetch("/api/velora", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "submit",
                        order: builtOrder.value,
                        signature: compactSignature,
                    }),
                });

                if (!submitResponse.ok) {
                    const errorText = await submitResponse.text();
                    console.error("[Velora] Submit failed:", errorText);
                    throw new Error("Failed to submit order");
                }

                const submitResult = await submitResponse.json();
                console.log("[Velora] Order submitted:", submitResult);

                return {
                    success: true,
                    orderId: submitResult.id,
                };
            } else if (quote.market) {
                // Market fallback - Delta not available on this chain
                console.log("[Velora] Delta not available, using market swap...");
                console.log("[Velora] Fallback reason:", quote.fallbackReason);

                // For now, show a message that gasless swaps aren't available on Arbitrum
                return {
                    success: false,
                    error: "Gasless swaps not yet available on Arbitrum. Coming soon!",
                };
            } else {
                return {
                    success: false,
                    error: "No pricing available",
                };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Swap failed";
            console.error("[Velora] Swap error:", err);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [quote, walletClient, activeWalletAddress]);

    // Track order status
    const trackOrder = useCallback(async (orderId: string) => {
        try {
            const response = await fetch("/api/velora", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "status",
                    orderId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get order status");
            }

            return await response.json();
        } catch (err) {
            console.error("[Velora] Track error:", err);
            return null;
        }
    }, []);

    // Calculate exchange rate from quote
    const getExchangeRate = useCallback((): string | null => {
        if (!quote) return null;

        const priceData = quote.delta || quote.market;
        if (!priceData) return null;

        const srcAmount = parseFloat(priceData.srcUSD);
        const destAmount = parseFloat(priceData.destUSD);

        if (srcAmount === 0) return null;

        return (destAmount / srcAmount).toFixed(2);
    }, [quote]);

    // Get destination amount from quote
    const getDestAmount = useCallback(
        (destDecimals: number): string | null => {
            if (!quote) return null;

            const priceData = quote.delta || quote.market;
            if (!priceData) return null;

            const amount = BigInt(priceData.destAmount);
            const divisor = BigInt(10 ** destDecimals);
            const wholePart = amount / divisor;
            const fractionalPart = amount % divisor;

            return `${wholePart}.${fractionalPart.toString().padStart(destDecimals, "0")}`.replace(
                /\.?0+$/,
                ""
            );
        },
        [quote]
    );

    return {
        quote,
        isLoading,
        error,
        getQuote,
        executeSwap,
        trackOrder,
        getExchangeRate,
        getDestAmount,
    };
}
