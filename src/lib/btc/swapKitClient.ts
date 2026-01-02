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

// Lazy-loaded SDK modules (to avoid build-time CSS import issues)
let _swapKitApi: typeof import('@swapkit/sdk').SwapKitApi | null = null;
let _FeeTypeEnum: typeof import('@swapkit/sdk').FeeTypeEnum | null = null;

async function getSwapKitApi() {
  if (!_swapKitApi) {
    const sdk = await import('@swapkit/sdk');
    _swapKitApi = sdk.SwapKitApi;
    _FeeTypeEnum = sdk.FeeTypeEnum;
  }
  return { SwapKitApi: _swapKitApi, FeeTypeEnum: _FeeTypeEnum! };
}

/**
 * SwapKit client wrapper for THORChain integration
 * Handles quote fetching and deposit address generation for BTC ↔ WBTC swaps
 */
export const swapKitClient = {
  /**
   * Get a quote for swapping between BTC and WBTC
   */
  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const { SwapKitApi, FeeTypeEnum } = await getSwapKitApi();

    const response = await SwapKitApi.getSwapQuote({
      sellAsset: request.sellAsset,
      buyAsset: request.buyAsset,
      sellAmount: request.sellAmount,
      sourceAddress: request.senderAddress,
      destinationAddress: request.recipientAddress,
      affiliate: request.affiliateAddress,
      affiliateFee: request.affiliateBps,
    });

    // Get the first route from the response
    const route = response.routes[0];
    if (!route) {
      throw new Error('No routes available');
    }

    // Calculate total fees
    const totalFees = route.fees?.reduce((acc, fee) => acc + parseFloat(fee.amount || '0'), 0) || 0;

    // Handle estimatedTime which can be a number or an object
    let estimatedTime = 600;
    if (typeof route.estimatedTime === 'number') {
      estimatedTime = route.estimatedTime;
    } else if (route.estimatedTime && typeof route.estimatedTime === 'object') {
      estimatedTime = route.estimatedTime.total || 600;
    }

    return {
      expectedOutput: route.expectedBuyAmount,
      expectedOutputUSD: route.expectedBuyAmount, // USD conversion handled elsewhere
      minimumOutput: route.expectedBuyAmountMaxSlippage,
      estimatedTime,
      fees: {
        affiliate: String(route.fees?.find(f => f.type === FeeTypeEnum.AFFILIATE)?.amount || '0'),
        outbound: String(route.fees?.find(f => f.type === FeeTypeEnum.OUTBOUND)?.amount || '0'),
        liquidity: String(totalFees),
      },
      route: {
        providers: route.providers || [],
        sellAsset: route.sellAsset || request.sellAsset,
        buyAsset: route.buyAsset,
      },
      streamingSwap: undefined, // Streaming swap config not available in v4 API response
      warnings: (route.warnings || []).map(w => w.display || String(w.code)),
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

    const { SwapKitApi } = await getSwapKitApi();

    // Fetch fresh data
    const addresses = await SwapKitApi.thornode.getInboundAddresses();

    // Update cache
    addressCache = {
      data: addresses.map((addr) => ({
        chain: addr.chain,
        address: addr.address,
        router: addr.router || '',
        gasRate: addr.gas_rate || '0',
        gasRateUnits: addr.gas_rate_units || 'satsperbyte',
        halted: addr.halted,
        haltedChain: addr.chain_trading_paused || false,
        globalTradingPaused: addr.global_trading_paused || false,
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
