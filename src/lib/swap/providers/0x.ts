/**
 * 0x Gasless API Provider
 * 
 * Adapter for 0x's gasless swap API using EIP-712 metatransactions.
 * Supports Ethereum and Arbitrum.
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

const OX_API_URL = "https://api.0x.org";

/**
 * Get the 0x API key from environment
 */
function getApiKey(): string {
    const apiKey = process.env.OX_API_KEY;
    if (!apiKey) {
        throw new Error("[0x] Missing OX_API_KEY environment variable");
    }
    return apiKey;
}

/**
 * 0x Gasless API Provider implementation
 */
export class ZeroXProvider implements SwapProvider {
    readonly name: SwapProviderName = "0x";
    readonly supportedChains: SupportedChainId[] = [1, 42161]; // Ethereum, Arbitrum

    supportsChain(chainId: number): boolean {
        return this.supportedChains.includes(chainId as SupportedChainId);
    }

    async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
        const apiKey = getApiKey();

        const queryParams = new URLSearchParams({
            chainId: params.chainId.toString(),
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            sellAmount: params.sellAmount,
            taker: params.takerAddress,
        });

        console.log("[0x] Fetching gasless quote:", queryParams.toString());

        const response = await fetch(`${OX_API_URL}/gasless/quote?${queryParams}`, {
            headers: {
                "Content-Type": "application/json",
                "0x-api-key": apiKey,
                "0x-version": "v2",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[0x] Quote error:", response.status, errorText);

            // Try to parse the error for better messaging
            let parsedError = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                parsedError = errorJson.reason || errorJson.description || errorJson.message || errorText;
            } catch {
                // Keep original text
            }

            throw new Error(`0x API error: ${response.status} - ${parsedError}`);
        }

        const data = await response.json();
        console.log("[0x] Quote response received");

        // Transform 0x response to unified SwapQuote format
        return {
            provider: "0x",
            chainId: params.chainId,
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            sellAmount: data.sellAmount || params.sellAmount,
            buyAmount: data.buyAmount,
            liquidityAvailable: data.liquidityAvailable ?? true,
            trade: data.trade ? {
                type: data.trade.type,
                hash: data.trade.hash,
                eip712: data.trade.eip712,
            } : undefined,
            approval: data.approval ? {
                type: data.approval.type,
                hash: data.approval.hash,
                eip712: data.approval.eip712,
            } : undefined,
            totalNetworkFee: data.totalNetworkFee,
            metadata: {
                allowanceTarget: data.allowanceTarget,
                blockNumber: data.blockNumber,
            },
        };
    }

    async submitSwap(payload: SwapSubmitPayload): Promise<SwapResult> {
        const apiKey = getApiKey();

        // Transform unified payload to 0x format
        const oxPayload = {
            chainId: payload.chainId,
            trade: {
                type: payload.trade.type,
                eip712: payload.trade.eip712,
                signature: {
                    r: payload.trade.signature.r,
                    s: payload.trade.signature.s,
                    v: payload.trade.signature.v,
                    signatureType: payload.trade.signature.signatureType ?? 2,
                },
            },
            approval: payload.approval ? {
                type: payload.approval.type,
                eip712: payload.approval.eip712,
                signature: {
                    r: payload.approval.signature.r,
                    s: payload.approval.signature.s,
                    v: payload.approval.signature.v,
                    signatureType: payload.approval.signature.signatureType ?? 2,
                },
            } : undefined,
        };

        console.log("[0x] Submit request:", JSON.stringify({
            chainId: oxPayload.chainId,
            tradeType: oxPayload.trade?.type,
            tradeSig: oxPayload.trade?.signature ? {
                v: oxPayload.trade.signature.v,
                r: oxPayload.trade.signature.r?.slice(0, 10),
                signatureType: oxPayload.trade.signature.signatureType
            } : null,
            approvalSig: oxPayload.approval?.signature ? {
                v: oxPayload.approval.signature.v,
                signatureType: oxPayload.approval.signature.signatureType
            } : null,
        }));

        const response = await fetch(`${OX_API_URL}/gasless/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "0x-api-key": apiKey,
                "0x-version": "v2",
            },
            body: JSON.stringify(oxPayload),
        });

        console.log("[0x] Submit response status:", response.status);

        const responseText = await response.text();
        console.log("[0x] Submit response body:", responseText.slice(0, 500));

        if (!response.ok) {
            // Try to extract zid from error response
            let zid: string | undefined;
            try {
                const errorJson = JSON.parse(responseText);
                zid = errorJson.data?.zid;
            } catch {
                // Ignore parse error
            }

            return {
                success: false,
                provider: "0x",
                error: `0x API error: ${response.status} - ${responseText}`,
                zid,
            };
        }

        const data = JSON.parse(responseText);
        console.log("[0x] Swap submitted successfully:", data.tradeHash);

        return {
            success: true,
            provider: "0x",
            tradeHash: data.tradeHash,
            zid: data.zid,
        };
    }
}

// Singleton instance
export const zeroXProvider = new ZeroXProvider();
