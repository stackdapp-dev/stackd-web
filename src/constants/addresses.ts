import { Address } from "viem";

/**
 * Token contract addresses on Arbitrum One
 */
export const TOKEN_ADDRESSES = {
  WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f" as Address,
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as Address,
} as const;

/**
 * Gnosis Safe address for cashout multisig
 * Available only on Arbitrum and Ethereum chain
 */
export const CASHOUT_MULTISIG_ADDRESS: Address =
  "0x43208B0ba89ebeC5a7735ed06366236FcaFD6eF8";
