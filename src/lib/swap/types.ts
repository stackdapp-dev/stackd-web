/**
 * Gasless Swap Provider Types
 * 
 * Common interfaces for multi-provider swap aggregation with failover support.
 */

/**
 * Supported blockchain networks
 */
export type SupportedChainId = 1 | 42161; // Ethereum Mainnet | Arbitrum One

/**
 * Swap provider identifiers
 */
export type SwapProviderName = "0x" | "1inch" | "cow";

/**
 * Parameters for requesting a swap quote
 */
export interface SwapQuoteParams {
    chainId: SupportedChainId;
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    takerAddress: string;
}

/**
 * EIP-712 typed data structure for signing
 */
export interface EIP712TypedData {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
}

/**
 * Signature components for submission
 */
export interface SignatureData {
    r: string;
    s: string;
    v: number;
    signatureType?: number;
}

/**
 * Approval data if token approval is needed
 */
export interface ApprovalData {
    type: string;
    hash?: string;
    eip712: EIP712TypedData;
}

/**
 * Trade data for the swap
 */
export interface TradeData {
    type: string;
    hash?: string;
    eip712: EIP712TypedData;
}

/**
 * Unified quote format across all providers
 */
export interface SwapQuote {
    provider: SwapProviderName;
    chainId: SupportedChainId;

    // Token info
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    buyAmount: string;

    // Availability
    liquidityAvailable: boolean;

    // Signing data
    trade?: TradeData;
    approval?: ApprovalData;

    // Fees (optional, in native token wei)
    estimatedGas?: string;
    totalNetworkFee?: string;

    // Provider-specific metadata
    metadata?: Record<string, unknown>;
}

/**
 * Payload for submitting a signed swap
 */
export interface SwapSubmitPayload {
    chainId: SupportedChainId;
    trade: {
        type: string;
        eip712: EIP712TypedData;
        signature: SignatureData;
    };
    approval?: {
        type: string;
        eip712: EIP712TypedData;
        signature: SignatureData;
    };
}

/**
 * Result of a swap execution
 */
export interface SwapResult {
    success: boolean;
    provider: SwapProviderName;
    tradeHash?: string;
    error?: string;

    // For tracking/debugging
    zid?: string; // 0x request ID
    orderId?: string; // 1inch/CoW order ID
}

/**
 * Provider interface that all swap providers must implement
 */
export interface SwapProvider {
    readonly name: SwapProviderName;
    readonly supportedChains: SupportedChainId[];

    /**
     * Check if this provider supports the given chain
     */
    supportsChain(chainId: number): boolean;

    /**
     * Get a quote for the swap
     */
    getQuote(params: SwapQuoteParams): Promise<SwapQuote>;

    /**
     * Submit a signed swap for execution
     */
    submitSwap(payload: SwapSubmitPayload): Promise<SwapResult>;
}

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
    /** Ordered list of providers to try (first = highest priority) */
    providerOrder: SwapProviderName[];

    /** Whether to fetch quotes from all providers in parallel */
    parallelQuotes?: boolean;

    /** Timeout for quote fetching (ms) */
    quoteTimeout?: number;
}
