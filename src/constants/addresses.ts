import { Address } from "viem";

/**
 * Token contract addresses on Arbitrum One
 */
export const TOKEN_ADDRESSES = {
  WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f" as Address,
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as Address,
} as const;

/**
 * Token contract addresses on Ethereum Mainnet
 */
export const ETHEREUM_TOKEN_ADDRESSES = {
  XAUT: "0x68749665FF8D2d112Fa859AA293F07A622782F38" as Address,
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
} as const;

/**
 * Fluid Protocol contract addresses on Ethereum Mainnet
 */
export const FLUID_ADDRESSES = {
  VAULT_FACTORY: "0x324c5Dc1fC42c7a4D43d92df1eBA58a54d13Bf2d" as Address,
  LIQUIDITY: "0x52Aa899454998Be5b000Ad077a46Bbe360F4e497" as Address,
} as const;

/**
 * Gnosis Safe address for cashout multisig
 * Available only on Arbitrum and Ethereum chain
 */
export const CASHOUT_MULTISIG_ADDRESS: Address =
  "0x43208B0ba89ebeC5a7735ed06366236FcaFD6eF8";
