/**
 * Swap Module Exports
 * 
 * Provides gasless swap functionality across multiple providers with failover.
 */

// Types
export type {
    SupportedChainId,
    SwapProviderName,
    SwapQuoteParams,
    SwapQuote,
    SwapSubmitPayload,
    SwapResult,
    SwapProvider,
    AggregatorConfig,
    EIP712TypedData,
    SignatureData,
} from "./types";

// Aggregator functions
export {
    getQuoteWithFailover,
    submitSwapWithFailover,
    getAvailableProviders,
    getConfiguredProviders,
    isProviderConfigured,
    AllProvidersFailedError,
} from "./aggregator";

// Individual providers (for direct access if needed)
export { zeroXProvider } from "./providers/0x";
export { oneInchProvider } from "./providers/1inch";
export { cowProvider } from "./providers/cow";
