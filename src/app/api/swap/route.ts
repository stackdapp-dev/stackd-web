/**
 * Unified Swap API Route
 * 
 * Provides gasless swap functionality with automatic failover across providers.
 * 
 * GET /api/swap - Get best available quote
 * POST /api/swap - Submit signed swap with failover
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getQuoteWithFailover,
    submitSwapWithFailover,
    getConfiguredProviders,
    AllProvidersFailedError,
} from "@/lib/swap";
import type { SwapProviderName, SupportedChainId } from "@/lib/swap";

// Token addresses for convenience (Arbitrum)
const TOKENS: Record<string, Record<number, string>> = {
    WBTC: {
        1: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // Ethereum
        42161: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", // Arbitrum
    },
    USDT: {
        1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Ethereum
        42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum
    },
};

/**
 * GET /api/swap - Get swap quote with failover
 * 
 * Query params:
 * - chainId: 1 (Ethereum) or 42161 (Arbitrum)
 * - sellToken: Token address or symbol (WBTC, USDT)
 * - buyToken: Token address or symbol
 * - sellAmount: Amount in smallest unit
 * - taker: Wallet address
 * - provider: (optional) Force specific provider
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chainIdStr = searchParams.get("chainId") || "42161";
    const sellToken = searchParams.get("sellToken");
    const buyToken = searchParams.get("buyToken");
    const sellAmount = searchParams.get("sellAmount");
    const taker = searchParams.get("taker");
    const preferredProvider = searchParams.get("provider") as SwapProviderName | null;

    // Validate required params
    if (!sellToken || !buyToken || !sellAmount || !taker) {
        return NextResponse.json(
            { error: "Missing required parameters: sellToken, buyToken, sellAmount, taker" },
            { status: 400 }
        );
    }

    const chainId = parseInt(chainIdStr) as SupportedChainId;
    if (chainId !== 1 && chainId !== 42161) {
        return NextResponse.json(
            { error: "Invalid chainId. Supported: 1 (Ethereum), 42161 (Arbitrum)" },
            { status: 400 }
        );
    }

    // Resolve token addresses
    const sellTokenAddress = TOKENS[sellToken]?.[chainId] || sellToken;
    const buyTokenAddress = TOKENS[buyToken]?.[chainId] || buyToken;

    // Check configured providers
    const configuredProviders = getConfiguredProviders(chainId);
    if (configuredProviders.length === 0) {
        return NextResponse.json(
            { error: "No swap providers configured for this chain" },
            { status: 503 }
        );
    }

    try {
        console.log(`[Swap API] Getting quote on chain ${chainId}:`, {
            sellToken: sellTokenAddress,
            buyToken: buyTokenAddress,
            sellAmount,
            taker,
            configuredProviders,
        });

        const quote = await getQuoteWithFailover(
            {
                chainId,
                sellToken: sellTokenAddress,
                buyToken: buyTokenAddress,
                sellAmount,
                takerAddress: taker,
            },
            preferredProvider ? { providerOrder: [preferredProvider, ...configuredProviders.filter(p => p !== preferredProvider)] } : undefined
        );

        console.log(`[Swap API] Quote received from ${quote.provider}`);

        return NextResponse.json({
            ...quote,
            configuredProviders,
        });
    } catch (error) {
        if (error instanceof AllProvidersFailedError) {
            console.error("[Swap API] All providers failed:", error.errors);
            return NextResponse.json(
                {
                    error: "All swap providers failed",
                    providerErrors: error.errors,
                },
                { status: 503 }
            );
        }

        console.error("[Swap API] Quote error:", error);
        return NextResponse.json(
            { error: "Failed to fetch quote" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/swap - Submit signed swap with failover
 * 
 * Body:
 * - chainId: Chain ID
 * - provider: Provider that generated the quote
 * - trade: Trade data with signature
 * - approval: (optional) Approval data with signature
 * - quoteParams: Original quote parameters for failover
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chainId, provider, trade, approval, quoteParams } = body;

        if (!chainId || !provider || !trade) {
            return NextResponse.json(
                { error: "Missing required fields: chainId, provider, trade" },
                { status: 400 }
            );
        }

        console.log(`[Swap API] Submitting swap via ${provider} on chain ${chainId}`);

        const result = await submitSwapWithFailover(
            {
                chainId,
                trade,
                approval,
            },
            provider,
            quoteParams
        );

        if (!result.success) {
            console.error(`[Swap API] Swap failed:`, result.error);
            return NextResponse.json(
                {
                    error: result.error,
                    provider: result.provider,
                    needsRetry: true,
                },
                { status: 500 }
            );
        }

        console.log(`[Swap API] Swap successful via ${result.provider}:`, result.tradeHash);

        return NextResponse.json({
            success: true,
            provider: result.provider,
            tradeHash: result.tradeHash,
            orderId: result.orderId,
        });
    } catch (error) {
        console.error("[Swap API] Submit error:", error);
        return NextResponse.json(
            { error: "Failed to submit swap" },
            { status: 500 }
        );
    }
}
