/**
 * CoW Protocol Provider
 * 
 * Adapter for CoW Swap gasless trades using batch auction mechanism.
 * Solvers compete to fill orders in batches for MEV protection.
 * 
 * Supports Ethereum and Arbitrum.
 * No API key required (permissionless).
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

// CoW Protocol API endpoints per chain
const COW_API_URLS: Record<SupportedChainId, string> = {
    1: "https://api.cow.fi/mainnet",
    42161: "https://api.cow.fi/arbitrum_one",
};

/**
 * Get the CoW API URL for a given chain
 */
function getApiUrl(chainId: SupportedChainId): string {
    const url = COW_API_URLS[chainId];
    if (!url) {
        throw new Error(`[CoW] Unsupported chain: ${chainId}`);
    }
    return url;
}

/**
 * CoW Protocol Provider implementation
 * 
 * Uses intent-based trading where solvers batch and execute orders.
 * Provides MEV protection and gasless execution for supported tokens.
 */
export class CowProvider implements SwapProvider {
    readonly name: SwapProviderName = "cow";
    readonly supportedChains: SupportedChainId[] = [1, 42161]; // Ethereum, Arbitrum

    supportsChain(chainId: number): boolean {
        return this.supportedChains.includes(chainId as SupportedChainId);
    }

    async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
        const apiUrl = getApiUrl(params.chainId);

        // CoW Protocol order quote request
        const quoteRequest = {
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            sellAmountBeforeFee: params.sellAmount,
            from: params.takerAddress,
            receiver: params.takerAddress,
            appData: "0x0000000000000000000000000000000000000000000000000000000000000000",
            partiallyFillable: false,
            sellTokenBalance: "erc20",
            buyTokenBalance: "erc20",
            kind: "sell",
            signingScheme: "eip712",
        };

        console.log("[CoW] Fetching quote for:", params.sellToken, "->", params.buyToken);

        const response = await fetch(`${apiUrl}/api/v1/quote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(quoteRequest),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[CoW] Quote error:", response.status, errorText);
            throw new Error(`CoW API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("[CoW] Quote response received");

        // CoW returns the order data and EIP-712 typed data for signing
        const order = data.quote;

        // Construct EIP-712 typed data for CoW order
        const eip712Domain = {
            name: "Gnosis Protocol",
            version: "v2",
            chainId: params.chainId,
            verifyingContract: "0x9008D19f58AAbD9eD0D60971565AA8510560ab41", // GPv2Settlement
        };

        const eip712Types = {
            Order: [
                { name: "sellToken", type: "address" },
                { name: "buyToken", type: "address" },
                { name: "receiver", type: "address" },
                { name: "sellAmount", type: "uint256" },
                { name: "buyAmount", type: "uint256" },
                { name: "validTo", type: "uint32" },
                { name: "appData", type: "bytes32" },
                { name: "feeAmount", type: "uint256" },
                { name: "kind", type: "string" },
                { name: "partiallyFillable", type: "bool" },
                { name: "sellTokenBalance", type: "string" },
                { name: "buyTokenBalance", type: "string" },
            ],
        };

        return {
            provider: "cow",
            chainId: params.chainId,
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            sellAmount: order.sellAmount,
            buyAmount: order.buyAmount,
            liquidityAvailable: true,
            trade: {
                type: "cow_order",
                eip712: {
                    domain: eip712Domain,
                    types: eip712Types,
                    primaryType: "Order",
                    message: {
                        sellToken: order.sellToken,
                        buyToken: order.buyToken,
                        receiver: params.takerAddress,
                        sellAmount: order.sellAmount,
                        buyAmount: order.buyAmount,
                        validTo: order.validTo,
                        appData: order.appData,
                        feeAmount: order.feeAmount,
                        kind: order.kind,
                        partiallyFillable: order.partiallyFillable,
                        sellTokenBalance: order.sellTokenBalance,
                        buyTokenBalance: order.buyTokenBalance,
                    },
                },
            },
            totalNetworkFee: order.feeAmount,
            metadata: {
                quoteId: data.id,
                validTo: order.validTo,
                feeAmount: order.feeAmount,
            },
        };
    }

    async submitSwap(payload: SwapSubmitPayload): Promise<SwapResult> {
        const apiUrl = getApiUrl(payload.chainId);

        // Reconstruct the signature from r, s, v
        const signature = `0x${payload.trade.signature.r.slice(2)}${payload.trade.signature.s.slice(2)}${payload.trade.signature.v.toString(16).padStart(2, "0")}`;

        // CoW Protocol order submission
        const orderPayload = {
            ...payload.trade.eip712.message,
            signature,
            signingScheme: "eip712",
        };

        console.log("[CoW] Submitting order...");

        const response = await fetch(`${apiUrl}/api/v1/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderPayload),
        });

        const responseText = await response.text();
        console.log("[CoW] Submit response:", response.status, responseText.slice(0, 200));

        if (!response.ok) {
            return {
                success: false,
                provider: "cow",
                error: `CoW API error: ${response.status} - ${responseText}`,
            };
        }

        // CoW returns the order UID
        const orderUid = responseText.replace(/"/g, "");
        console.log("[CoW] Order submitted successfully:", orderUid);

        return {
            success: true,
            provider: "cow",
            tradeHash: orderUid,
            orderId: orderUid,
        };
    }
}

// Singleton instance
export const cowProvider = new CowProvider();
