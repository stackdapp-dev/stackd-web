/**
 * 1inch Fusion Provider
 * 
 * Adapter for 1inch Fusion gasless swaps using Dutch auction mechanism.
 * Resolvers compete to fill orders and cover gas costs.
 * 
 * Supports Ethereum and Arbitrum.
 * Requires ONEINCH_API_KEY from portal.1inch.dev
 */

import type {
    SwapProvider,
    SwapProviderName,
    SupportedChainId,
    SwapQuoteParams,
    SwapQuote,
    SwapSubmitPayload,
    SwapResult,
} from "../types";

const ONEINCH_API_URL = "https://api.1inch.dev";

/**
 * Get the 1inch API key from environment
 */
function getApiKey(): string {
    const apiKey = process.env.ONEINCH_API_KEY;
    if (!apiKey) {
        throw new Error("[1inch] Missing ONEINCH_API_KEY environment variable");
    }
    return apiKey;
}

/**
 * 1inch Fusion Provider implementation
 * 
 * Fusion mode uses intent-based trading where resolvers fill orders.
 * Users sign an order, and resolvers compete in a Dutch auction to execute it.
 */
export class OneInchProvider implements SwapProvider {
    readonly name: SwapProviderName = "1inch";
    readonly supportedChains: SupportedChainId[] = [1, 42161]; // Ethereum, Arbitrum

    supportsChain(chainId: number): boolean {
        return this.supportedChains.includes(chainId as SupportedChainId);
    }

    async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
        const apiKey = getApiKey();

        // 1inch Fusion uses the fusion quote endpoint
        const queryParams = new URLSearchParams({
            fromTokenAddress: params.sellToken,
            toTokenAddress: params.buyToken,
            amount: params.sellAmount,
            walletAddress: params.takerAddress,
            enableEstimate: "true",
        });

        console.log("[1inch] Fetching Fusion quote:", queryParams.toString());

        const response = await fetch(
            `${ONEINCH_API_URL}/fusion/quoter/v1.0/${params.chainId}/quote/receive?${queryParams}`,
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[1inch] Quote error:", response.status, errorText);
            throw new Error(`1inch API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("[1inch] Quote response received");

        // 1inch Fusion returns order data that needs to be signed
        // The actual EIP-712 data is constructed from the order
        const orderData = data.order || data;

        return {
            provider: "1inch",
            chainId: params.chainId,
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            sellAmount: params.sellAmount,
            buyAmount: data.toTokenAmount || data.dstAmount || "0",
            liquidityAvailable: true,
            trade: orderData.typedData ? {
                type: "fusion_order",
                eip712: {
                    domain: orderData.typedData.domain,
                    types: orderData.typedData.types,
                    primaryType: orderData.typedData.primaryType,
                    message: orderData.typedData.message,
                },
            } : undefined,
            // 1inch Fusion doesn't require separate approval for most tokens
            // It uses permit or the order includes approval
            metadata: {
                quoteId: data.quoteId,
                preset: data.preset,
                recommendedPreset: data.recommendedPreset,
                auctionStartTime: data.auctionStartTime,
                auctionEndTime: data.auctionEndTime,
            },
        };
    }

    async submitSwap(payload: SwapSubmitPayload): Promise<SwapResult> {
        const apiKey = getApiKey();

        // 1inch Fusion submission format
        const fusionPayload = {
            order: payload.trade.eip712.message,
            signature: `0x${payload.trade.signature.r.slice(2)}${payload.trade.signature.s.slice(2)}${payload.trade.signature.v.toString(16).padStart(2, "0")}`,
            quoteId: (payload.trade.eip712.message as Record<string, unknown>).quoteId,
        };

        console.log("[1inch] Submitting Fusion order...");

        const response = await fetch(
            `${ONEINCH_API_URL}/fusion/relayer/v1.0/${payload.chainId}/order/submit`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(fusionPayload),
            }
        );

        const responseText = await response.text();
        console.log("[1inch] Submit response:", response.status, responseText.slice(0, 200));

        if (!response.ok) {
            return {
                success: false,
                provider: "1inch",
                error: `1inch API error: ${response.status} - ${responseText}`,
            };
        }

        const data = JSON.parse(responseText);
        console.log("[1inch] Order submitted successfully:", data.orderHash);

        return {
            success: true,
            provider: "1inch",
            tradeHash: data.orderHash,
            orderId: data.orderHash,
        };
    }
}

// Singleton instance
export const oneInchProvider = new OneInchProvider();
