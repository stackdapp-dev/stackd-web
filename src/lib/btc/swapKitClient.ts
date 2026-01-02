import { SwapKitApi } from '@swapkit/sdk';
import type {
  QuoteRequest,
  QuoteResponse,
  DepositAddress,
  SwapMemoParams,
} from './types';

// Cache for inbound addresses
interface AddressCache {
  data: DepositAddress[];
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let addressCache: AddressCache | null = null;

/**
 * SwapKit client wrapper for THORChain integration
 * Handles quote fetching and deposit address generation for BTC ↔ WBTC swaps
 */
export const swapKitClient = {
  /**
   * Get a quote for swapping between BTC and WBTC
   */
  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const response = await SwapKitApi.getQuote({
      sellAsset: request.sellAsset,
      buyAsset: request.buyAsset,
      sellAmount: request.sellAmount,
      senderAddress: request.senderAddress,
      recipientAddress: request.recipientAddress,
      streaming: request.streaming,
      affiliateAddress: request.affiliateAddress,
      affiliateBps: request.affiliateBps,
    });

    return {
      expectedOutput: response.expectedOutput,
      expectedOutputUSD: response.expectedOutputUSD,
      minimumOutput: response.minimumOutput,
      estimatedTime: response.estimatedTime,
      fees: {
        affiliate: response.fees.affiliate,
        outbound: response.fees.outbound,
        liquidity: response.fees.liquidity,
      },
      route: {
        providers: response.route.providers,
        sellAsset: response.route.sellAsset,
        buyAsset: response.route.buyAsset,
      },
      streamingSwap: response.streamingSwap,
      warnings: response.warnings || [],
    };
  },

  /**
   * Get THORChain inbound deposit address for a chain
   * Results are cached for 5 minutes
   */
  async getDepositAddress(chain: string): Promise<DepositAddress> {
    // Check cache
    const now = Date.now();
    if (addressCache && now - addressCache.timestamp < CACHE_TTL_MS) {
      const cached = addressCache.data.find((addr) => addr.chain === chain);
      if (cached) {
        if (cached.halted) {
          throw new Error('Chain is halted');
        }
        return cached;
      }
    }

    // Fetch fresh data
    const addresses = await SwapKitApi.getInboundAddresses();

    // Update cache
    addressCache = {
      data: addresses.map((addr) => ({
        chain: addr.chain,
        address: addr.address,
        router: addr.router || '',
        gasRate: addr.gasRate,
        gasRateUnits: addr.gasRateUnits,
        halted: addr.halted,
        haltedChain: addr.haltedChain,
        globalTradingPaused: addr.globalTradingPaused,
      })),
      timestamp: now,
    };

    // Find the requested chain
    const depositAddress = addressCache.data.find((addr) => addr.chain === chain);

    if (!depositAddress) {
      throw new Error('Chain not found');
    }

    if (depositAddress.halted) {
      throw new Error('Chain is halted');
    }

    return depositAddress;
  },

  /**
   * Build a THORChain swap memo for deposit transactions
   */
  buildSwapMemo(params: SwapMemoParams): string {
    const {
      buyAsset,
      recipientAddress,
      minOutput,
      affiliateAddress,
      affiliateBps,
      streamingInterval,
      streamingQuantity,
    } = params;

    // THORChain memo format: SWAP:ASSET:DESTADDR:LIM:AFFILIATE:FEE:DEX/STREAM
    let memo = `=:${buyAsset}:${recipientAddress}:${minOutput}`;

    // Add affiliate info if provided
    if (affiliateAddress && affiliateBps !== undefined) {
      memo += `:${affiliateAddress}:${affiliateBps}`;
    }

    // Add streaming params if provided
    if (streamingInterval !== undefined && streamingQuantity !== undefined) {
      memo += `/${streamingInterval}/${streamingQuantity}`;
    }

    return memo;
  },

  /**
   * Clear the address cache (useful for testing)
   */
  clearCache(): void {
    addressCache = null;
  },
};
