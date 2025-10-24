import type { Address } from "viem";

/**
 * Token contract addresses on Arbitrum One
 */
export const TOKEN_ADDRESSES = {
  WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f" as Address,
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as Address,
} as const;

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
