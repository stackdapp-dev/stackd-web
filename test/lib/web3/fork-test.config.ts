/**
 * Fork Test Configuration
 * 
 * This file contains constants for deterministic fork testing.
 * All fork tests should use these values for consistent, reproducible results.
 */

// Arbitrum fork block number for deterministic testing
// Captured on: 2026-01-21
// This ensures all fork tests run against the same blockchain state
export const ARBITRUM_FORK_BLOCK = 423785515n;

// Test wallet addresses
export const TEST_WALLETS = {
  // Wallet with WBTC balance for testing supply operations
  // Balance at fork block: ~0.00294523 WBTC
  WBTC_HOLDER: "0x00D4E9AA729124858670AEFB5960a9af56970939" as const,
  
  // Original user who reported the bug
  BUG_REPORTER: "0x8FbCcC7993D22c2E15A43f9E0c89588dda94E46A" as const,
} as const;

// Contract addresses on Arbitrum
export const ARBITRUM_CONTRACTS = {
  // Compound V3 (Comet) USDT Market
  COMET: "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07" as const,
  
  // Compound Bulker
  BULKER: "0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d" as const,
  
  // WBTC Token
  WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f" as const,
  
  // USDT Token
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as const,
} as const;

// RPC URLs
export const RPC_URLS = {
  ARBITRUM: "https://arb1.arbitrum.io/rpc",
} as const;

// Token decimals
export const TOKEN_DECIMALS = {
  WBTC: 8,
  USDT: 6,
} as const;
