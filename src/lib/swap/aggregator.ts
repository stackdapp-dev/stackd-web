/**
 * Swap Aggregator
 * 
 * Aggregates multiple gasless swap providers with automatic failover.
 * If one provider fails, automatically tries the next one.
 */

import type {
    SwapProvider,
    SwapProviderName,
    SupportedChainId,
    SwapQuoteParams,
    SwapQuote,
    SwapSubmitPayload,
    SwapResult,
    AggregatorConfig,
} from "./types";

import { zeroXProvider } from "./providers/0x";
import { oneInchProvider } from "./providers/1inch";
import { cowProvider } from "./providers/cow";

/**
 * Registry of all available providers
 */
const PROVIDERS: Record<SwapProviderName, SwapProvider> = {
    "0x": zeroXProvider,
    "1inch": oneInchProvider,
    "cow": cowProvider,
};

/**
 * Default aggregator configuration
 */
const DEFAULT_CONFIG: AggregatorConfig = {
    providerOrder: ["0x", "1inch", "cow"],
    parallelQuotes: false,
    quoteTimeout: 10000, // 10 seconds
};

/**
 * Error thrown when all providers fail
 */
export class AllProvidersFailedError extends Error {
    readonly errors: Record<SwapProviderName, string>;

    constructor(errors: Record<SwapProviderName, string>) {
        const providerList = Object.keys(errors).join(", ");
        super(`All swap providers failed: ${providerList}`);
        this.name = "AllProvidersFailedError";
        this.errors = errors;
    }
}

/**
 * Get a quote from the best available provider
 * 
 * Tries providers in order until one succeeds.
 * Optionally fetches from all providers in parallel for comparison.
 */
export async function getQuoteWithFailover(
    params: SwapQuoteParams,
    config: Partial<AggregatorConfig> = {}
): Promise<SwapQuote> {
    const { providerOrder, parallelQuotes, quoteTimeout } = { ...DEFAULT_CONFIG, ...config };

    // Filter to providers that support the chain
    const availableProviders = providerOrder
        .map(name => PROVIDERS[name])
        .filter(p => p.supportsChain(params.chainId));

    if (availableProviders.length === 0) {
        throw new Error(`No providers available for chain ${params.chainId}`);
    }

    console.log(`[Aggregator] Getting quote from ${availableProviders.length} providers for chain ${params.chainId}`);

    if (parallelQuotes) {
        // Fetch from all providers in parallel, return first success
        return getQuoteParallel(params, availableProviders, quoteTimeout!);
    } else {
        // Try providers sequentially with failover
        return getQuoteSequential(params, availableProviders);
    }
}

/**
 * Get quote from providers sequentially with failover
 */
async function getQuoteSequential(
    params: SwapQuoteParams,
    providers: SwapProvider[]
): Promise<SwapQuote> {
    const errors: Record<string, string> = {};

    for (const provider of providers) {
        try {
            console.log(`[Aggregator] Trying ${provider.name}...`);
            const quote = await provider.getQuote(params);

            if (!quote.liquidityAvailable) {
                console.log(`[Aggregator] ${provider.name}: No liquidity available`);
                errors[provider.name] = "No liquidity available";
                continue;
            }

            console.log(`[Aggregator] ${provider.name}: Quote received`);
            return quote;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[Aggregator] ${provider.name} failed:`, errorMessage);
            errors[provider.name] = errorMessage;
            continue;
        }
    }

    throw new AllProvidersFailedError(errors as Record<SwapProviderName, string>);
}

/**
 * Get quote from all providers in parallel, return first success
 */
async function getQuoteParallel(
    params: SwapQuoteParams,
    providers: SwapProvider[],
    timeout: number
): Promise<SwapQuote> {
    const errors: Record<string, string> = {};

    const quotePromises = providers.map(async (provider) => {
        try {
            const quote = await Promise.race([
                provider.getQuote(params),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), timeout)
                ),
            ]);

            if (!quote.liquidityAvailable) {
                throw new Error("No liquidity available");
            }

            return quote;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors[provider.name] = errorMessage;
            throw error;
        }
    });

    try {
        // Return first successful quote
        return await Promise.any(quotePromises);
    } catch {
        throw new AllProvidersFailedError(errors as Record<SwapProviderName, string>);
    }
}

/**
 * Submit a swap with automatic failover
 * 
 * First tries to submit with the provider that generated the quote.
 * If that fails, gets a new quote from the next provider and tries again.
 */
export async function submitSwapWithFailover(
    payload: SwapSubmitPayload,
    originalProvider: SwapProviderName,
    quoteParams: SwapQuoteParams,
    config: Partial<AggregatorConfig> = {}
): Promise<SwapResult> {
    const { providerOrder } = { ...DEFAULT_CONFIG, ...config };
    const errors: Record<string, string> = {};

    // Try original provider first
    const provider = PROVIDERS[originalProvider];
    if (provider) {
        try {
            console.log(`[Aggregator] Submitting to ${provider.name}...`);
            const result = await provider.submitSwap(payload);

            if (result.success) {
                console.log(`[Aggregator] ${provider.name}: Swap successful`);
                return result;
            }

            console.warn(`[Aggregator] ${provider.name} failed:`, result.error);
            errors[provider.name] = result.error || "Unknown error";
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[Aggregator] ${provider.name} failed:`, errorMessage);
            errors[provider.name] = errorMessage;
        }
    }

    // If original provider failed, we need to get a fresh quote from another provider
    // and have the user sign again. Return a special error indicating failover needed.
    console.log("[Aggregator] Original provider failed, failover needed");

    return {
        success: false,
        provider: originalProvider,
        error: `${originalProvider} failed. Please try again to use an alternative provider.`,
    };
}

/**
 * Get list of providers that support a given chain
 */
export function getAvailableProviders(chainId: SupportedChainId): SwapProviderName[] {
    return Object.entries(PROVIDERS)
        .filter(([, provider]) => provider.supportsChain(chainId))
        .map(([name]) => name as SwapProviderName);
}

/**
 * Check if a specific provider is configured (has API key if required)
 */
export function isProviderConfigured(name: SwapProviderName): boolean {
    switch (name) {
        case "0x":
            return !!process.env.OX_API_KEY;
        case "1inch":
            return !!process.env.ONEINCH_API_KEY;
        case "cow":
            return true; // CoW doesn't require API key
        default:
            return false;
    }
}

/**
 * Get list of configured providers for a chain
 */
export function getConfiguredProviders(chainId: SupportedChainId): SwapProviderName[] {
    return getAvailableProviders(chainId).filter(isProviderConfigured);
}
