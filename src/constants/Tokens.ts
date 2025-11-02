import { TOKEN_ADDRESSES } from "./addresses";

/**
 * Token metadata for display purposes
 */
export const TOKEN_METADATA = {
  WBTC: {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    address: TOKEN_ADDRESSES.WBTC,
    coingeckoSymbol: "btc",
    icon: "/assets/tokens/wbtc.png",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    address: TOKEN_ADDRESSES.USDT,
    coingeckoSymbol: "usdt",
    icon: "/assets/tokens/usdt.png",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    address: null, // Native token, no contract address
    coingeckoSymbol: "eth",
    icon: "/assets/tokens/eth.png",
  },
} as const;

export type TokenSymbol = keyof typeof TOKEN_ADDRESSES;

/**
 * Helper function to get token metadata by symbol
 */
export function getTokenMetadata(symbol: string) {
  return TOKEN_METADATA[symbol as keyof typeof TOKEN_METADATA];
}

/**
 * Helper function to get token address by symbol
 */
export function getTokenAddress(symbol: string) {
  return TOKEN_ADDRESSES[symbol as TokenSymbol];
}
