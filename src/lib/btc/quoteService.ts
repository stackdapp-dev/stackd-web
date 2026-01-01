import { swapKitClient } from './swapKitClient';
import { validateEvmAddress, validateBtcAddress } from './addressValidator';

// Cache configuration
const QUOTE_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const QUOTE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const MINIMUM_BTC_DEPOSIT = 0.001;

// Asset identifiers
const BTC_ASSET = 'BTC.BTC';
const WBTC_ARB_ASSET = 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f';

// Quote cache
interface CachedQuote<T> {
  data: T;
  timestamp: number;
}

const quoteCache = new Map<string, CachedQuote<DepositQuote | WithdrawalQuote>>();

export interface DepositQuoteParams {
  btcAmount: string;
  evmAddress: string;
}

export interface DepositQuote {
  inputAmount: string;
  inputAsset: string;
  outputAmount: string;
  outputAsset: string;
  depositAddress: string;
  memo: string;
  estimatedTime: number;
  fees: {
    affiliate: string;
    outbound: string;
    liquidity: string;
  };
  expiresAt: number;
  quoteId: string;
}

export interface WithdrawalQuoteParams {
  wbtcAmount: string;
  btcAddress: string;
  evmAddress: string;
}

export interface WithdrawalQuote {
  inputAmount: string;
  inputAsset: string;
  outputAmount: string;
  outputAsset: string;
  estimatedTime: number;
  fees: {
    affiliate: string;
    outbound: string;
    liquidity: string;
  };
  approvalRequired: boolean;
  quoteId: string;
  expiresAt: number;
}

/**
 * Generate a unique quote ID
 */
function generateQuoteId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a cache key for deposit quotes
 */
function getDepositCacheKey(params: DepositQuoteParams): string {
  return `deposit:${params.btcAmount}:${params.evmAddress}`;
}

/**
 * Generate a cache key for withdrawal quotes
 */
function getWithdrawalCacheKey(params: WithdrawalQuoteParams): string {
  return `withdrawal:${params.wbtcAmount}:${params.btcAddress}:${params.evmAddress}`;
}

/**
 * Check if a cached quote is still valid
 */
function isCacheValid<T>(cached: CachedQuote<T> | undefined): cached is CachedQuote<T> {
  if (!cached) return false;
  const now = Date.now();
  return now - cached.timestamp < QUOTE_CACHE_TTL_MS;
}

/**
 * Quote service for BTC ↔ WBTC swaps
 */
export const quoteService = {
  /**
   * Get a quote for depositing BTC to receive WBTC
   */
  async getDepositQuote(params: DepositQuoteParams): Promise<DepositQuote> {
    const { btcAmount, evmAddress } = params;

    // Validate EVM address
    const evmValidation = validateEvmAddress(evmAddress);
    if (!evmValidation.valid) {
      throw new Error(evmValidation.error);
    }

    // Check minimum deposit
    const amount = parseFloat(btcAmount);
    if (isNaN(amount) || amount < MINIMUM_BTC_DEPOSIT) {
      throw new Error(`Amount ${btcAmount} BTC is below minimum of ${MINIMUM_BTC_DEPOSIT} BTC`);
    }

    // Check cache
    const cacheKey = getDepositCacheKey(params);
    const cached = quoteCache.get(cacheKey);
    if (isCacheValid(cached)) {
      return cached.data as DepositQuote;
    }

    // Fetch quote from SwapKit
    const [quote, depositInfo] = await Promise.all([
      swapKitClient.getQuote({
        sellAsset: BTC_ASSET,
        buyAsset: WBTC_ARB_ASSET,
        sellAmount: btcAmount,
        senderAddress: '', // Will use deposit address
        recipientAddress: evmAddress,
      }),
      swapKitClient.getDepositAddress('BTC'),
    ]);

    // Build swap memo
    const memo = swapKitClient.buildSwapMemo({
      buyAsset: WBTC_ARB_ASSET,
      recipientAddress: evmAddress,
      minOutput: quote.minimumOutput,
    });

    const now = Date.now();
    const depositQuote: DepositQuote = {
      inputAmount: btcAmount,
      inputAsset: 'BTC',
      outputAmount: quote.expectedOutput,
      outputAsset: 'WBTC',
      depositAddress: depositInfo.address,
      memo,
      estimatedTime: quote.estimatedTime,
      fees: quote.fees,
      expiresAt: now + QUOTE_EXPIRATION_MS,
      quoteId: generateQuoteId(),
    };

    // Cache the quote
    quoteCache.set(cacheKey, {
      data: depositQuote,
      timestamp: now,
    });

    return depositQuote;
  },

  /**
   * Get a quote for withdrawing WBTC to receive BTC
   */
  async getWithdrawalQuote(params: WithdrawalQuoteParams): Promise<WithdrawalQuote> {
    const { wbtcAmount, btcAddress, evmAddress } = params;

    // Validate BTC address
    const btcValidation = validateBtcAddress(btcAddress);
    if (!btcValidation.valid) {
      throw new Error(btcValidation.error);
    }

    // Validate EVM address
    const evmValidation = validateEvmAddress(evmAddress);
    if (!evmValidation.valid) {
      throw new Error(evmValidation.error);
    }

    // Check cache
    const cacheKey = getWithdrawalCacheKey(params);
    const cached = quoteCache.get(cacheKey);
    if (isCacheValid(cached)) {
      return cached.data as WithdrawalQuote;
    }

    // Fetch quote from SwapKit
    const quote = await swapKitClient.getQuote({
      sellAsset: WBTC_ARB_ASSET,
      buyAsset: BTC_ASSET,
      sellAmount: wbtcAmount,
      senderAddress: evmAddress,
      recipientAddress: btcAddress,
    });

    const now = Date.now();
    const withdrawalQuote: WithdrawalQuote = {
      inputAmount: wbtcAmount,
      inputAsset: 'WBTC',
      outputAmount: quote.expectedOutput,
      outputAsset: 'BTC',
      estimatedTime: quote.estimatedTime,
      fees: quote.fees,
      approvalRequired: true, // WBTC always requires approval for THORChain router
      quoteId: generateQuoteId(),
      expiresAt: now + QUOTE_EXPIRATION_MS,
    };

    // Cache the quote
    quoteCache.set(cacheKey, {
      data: withdrawalQuote,
      timestamp: now,
    });

    return withdrawalQuote;
  },

  /**
   * Clear the quote cache (useful for testing)
   */
  clearCache(): void {
    quoteCache.clear();
  },
};
