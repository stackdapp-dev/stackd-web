import {
  FLUID_VAULT_RESOLVER_ADDR,
  FLUID_VAULT_RESOLVER_ABI,
} from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import { type Address, type PublicClient, type Hex, parseAbi, encodeFunctionData } from "viem";

// Fluid Vault ABI for the operate function - the core transaction method for all position changes
// The operate function handles: add collateral, withdraw collateral, borrow, repay
// Parameters:
//   nftId_: Position NFT ID (0 to create new position)
//   newCol_: Collateral change (positive = add, negative = withdraw)
//   newDebt_: Debt change (positive = borrow, negative = repay)
//   to_: Recipient address for withdrawn tokens
export const FLUID_VAULT_ABI = [
  {
    name: "operate",
    inputs: [
      { name: "nftId_", type: "uint256" },
      { name: "newCol_", type: "int256" },
      { name: "newDebt_", type: "int256" },
      { name: "to_", type: "address" },
    ],
    outputs: [
      { name: "nftId_", type: "uint256" },
      { name: "supplyAmt_", type: "int256" },
      { name: "borrowAmt_", type: "int256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const VAULT_RESOLVER_ADDRESS = formatAddress(FLUID_VAULT_RESOLVER_ADDR);

// Known XAUT/USDT vault on Ethereum mainnet
const XAUT_USDT_VAULT = "0xEce156BeD5aF2621b80b87ff4fE8fD3A929E3644" as const;

const SIMPLE_RESOLVER_ABI = parseAbi([
  "function positionsNftIdOfUser(address user_) view returns (uint256[])",
  "function vaultByNftId(uint256 nftId_) view returns (address)",
]);

// FLUID_VAULT_RESOLVER_ABI is for getVaultEntireData - see abis.ts

// ABI for positionByNftId - we use bytes for vaultData_ since it's a complex nested struct
// We only need the UserPosition data for supply/borrow values
const POSITION_BY_NFT_ABI = [
  {
    inputs: [{ name: "nftId_", type: "uint256" }],
    name: "positionByNftId",
    outputs: [
      {
        name: "userPosition_",
        type: "tuple",
        components: [
          { name: "nftId", type: "uint256" },
          { name: "owner", type: "address" },
          { name: "isLiquidated", type: "bool" },
          { name: "isSupplyPosition", type: "bool" },
          { name: "tick", type: "int256" },
          { name: "tickId", type: "uint256" },
          { name: "beforeSupply", type: "uint256" },
          { name: "beforeBorrow", type: "uint256" },
          { name: "beforeDustBorrow", type: "uint256" },
          { name: "supply", type: "uint256" },
          { name: "borrow", type: "uint256" },
          { name: "dustBorrow", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Note: These functions assume publicClient from Web3Provider.
// Pass it as a parameter.

// Types for Fluid position data
export interface FluidUserPosition {
  nftId: bigint;
  supply: bigint;
  borrow: bigint;
}

export interface FluidVaultData {
  vault: Address;
  supplyToken: Address;
  borrowToken: Address;
  collateralFactor: bigint;
  liquidationThreshold: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
  oraclePrice: bigint; // Oracle price in 27-decimal format (price * 10^27)
}

// Fluid uses 27 decimals for oracle prices (scaled by 1e27)
export const ORACLE_PRICE_DECIMALS = 27;

// Fluid vault minimum amount requirement (10000 raw units)
// The vault rejects amounts between -10000 and 10000 (exclusive)
// Both XAUT and USDT have 6 decimals, so minimum = 10000 / 10^6 = 0.01
export const FLUID_MIN_AMOUNT_RAW = BigInt(10000);
export const FLUID_MIN_COLLATERAL_XAUT = 0.01; // 0.01 XAUT minimum
export const FLUID_MIN_BORROW_USDT = 0.01;     // $0.01 USDT minimum

export interface FluidPositionWithVault {
  position: FluidUserPosition;
  vaultData: FluidVaultData;
}

export interface FluidUserPositionsResult {
  positions: FluidUserPosition[];
  vaultsData: FluidVaultData[];
}

// Known vault configurations for XAUT vaults
// These values come from the vault contract constants
// Note: borrowRate is now fetched live, this is just a fallback default
const KNOWN_VAULTS: Record<string, {
  supplyToken: Address;
  borrowToken: Address;
  supplyDecimals: number;
  borrowDecimals: number;
  // Default values - actual rates should be fetched from chain
  collateralFactor: bigint;
  liquidationThreshold: bigint;
  supplyRate: bigint;
  borrowRate: bigint; // Fallback if live fetch fails (~2% APR)
}> = {
  [XAUT_USDT_VAULT.toLowerCase()]: {
    supplyToken: "0x68749665FF8D2d112Fa859AA293F07A622782F38" as Address, // XAUT
    borrowToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address, // USDT
    supplyDecimals: 6, // XAUT has 6 decimals
    borrowDecimals: 6, // USDT has 6 decimals
    collateralFactor: BigInt(7500), // 75% - typical value
    liquidationThreshold: BigInt(8000), // 80% - typical value
    supplyRate: BigInt(0),
    borrowRate: BigInt("634195840"), // ~2% APR fallback (per-second rate scaled by 1e18)
  },
};

/**
 * Convert Fluid basis points rate to per-second rate scaled by 1e18
 * This matches the format used in the hardcoded fallback values
 * @param bpsRate - Rate in basis points (10000 = 100%, so 515 = 5.15%)
 * @returns Rate in per-second format scaled by 1e18
 */
export function bpsRateToPerSecondRate(bpsRate: bigint): bigint {
  // BPS is annual rate where 10000 = 100%
  // The hook's rateToApr function expects per-second rate scaled by 1e18
  // Annual rate = bpsRate / 10000 (as decimal)
  // Per-second = annual / (365 * 24 * 60 * 60)
  // Scaled by 1e18 = (bpsRate / 10000) / seconds_per_year * 1e18
  const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);
  // Simplified: (bpsRate * 1e18) / (10000 * SECONDS_PER_YEAR)
  return (bpsRate * BigInt(10 ** 18)) / (BigInt(10000) * SECONDS_PER_YEAR);
}

/**
 * Convert Fluid basis points rate to APR percentage directly
 * @param bpsRate - Rate in basis points (10000 = 100%, so 515 = 5.15%)
 * @returns APR as a percentage number (e.g., 5.15 for 5.15%)
 */
export function bpsRateToAprPercentage(bpsRate: bigint): number {
  // BPS format: 10000 = 100%
  // So APR% = bpsRate / 100
  return Number(bpsRate) / 100;
}

/**
 * Get all positions for a user from the Fluid VaultResolver
 * Uses a step-by-step approach that works with the complex Fluid structs
 * @param publicClient - The viem PublicClient instance
 * @param user - The user's wallet address
 * @returns Object containing arrays of user positions and corresponding vault data
 */
export async function getUserPositions(
  publicClient: PublicClient,
  user: Address
): Promise<FluidUserPositionsResult> {
  try {
    // Step 1: Get all NFT IDs for the user
    const nftIds = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: SIMPLE_RESOLVER_ABI,
      functionName: "positionsNftIdOfUser",
      args: [user],
    });

    console.log("[FLUID] Found NFT IDs:", nftIds.map(id => id.toString()));

    if (nftIds.length === 0) {
      return { positions: [], vaultsData: [] };
    }

    const positions: FluidUserPosition[] = [];
    const vaultsData: FluidVaultData[] = [];

    // Step 2: For each NFT, get the vault address and check if it's a known vault
    for (const nftId of nftIds) {
      try {
        const vaultAddress = await publicClient.readContract({
          address: VAULT_RESOLVER_ADDRESS,
          abi: SIMPLE_RESOLVER_ABI,
          functionName: "vaultByNftId",
          args: [nftId],
        });

        const knownVault = KNOWN_VAULTS[vaultAddress.toLowerCase()];

        if (knownVault) {
          console.log(`[FLUID] NFT ${nftId} is in known vault: ${vaultAddress}`);

          try {
            // Call 1 (critical): fetch actual position supply/borrow — must succeed
            const userPosition = await publicClient.readContract({
              address: VAULT_RESOLVER_ADDRESS,
              abi: POSITION_BY_NFT_ABI,
              functionName: "positionByNftId",
              args: [nftId],
            });

            console.log(`[FLUID] Position data for NFT ${nftId}:`, {
              supply: userPosition.supply.toString(),
              borrow: userPosition.borrow.toString(),
            });

            // Call 2 (optional): fetch live vault rates — use fallback if it fails
            let liveBorrowRate = knownVault.borrowRate;
            let liveSupplyRate = knownVault.supplyRate;
            let oraclePrice = BigInt(0);

            try {
              const vaultEntireData = await publicClient.readContract({
                address: VAULT_RESOLVER_ADDRESS,
                abi: FLUID_VAULT_RESOLVER_ABI,
                functionName: "getVaultEntireData",
                args: [vaultAddress],
              });

              const liveBorrowRateBps = vaultEntireData.exchangePricesAndRates.borrowRateVault;
              const liveSupplyRateBps = vaultEntireData.exchangePricesAndRates.supplyRateVault;
              liveBorrowRate = bpsRateToPerSecondRate(liveBorrowRateBps);
              liveSupplyRate = bpsRateToPerSecondRate(liveSupplyRateBps);

              const aprPercent = bpsRateToAprPercentage(liveBorrowRateBps);
              console.log(`[FLUID] Live borrow rate from resolver (bps): ${liveBorrowRateBps.toString()} (${aprPercent.toFixed(2)}% APR)`);

              oraclePrice = vaultEntireData.configs.oraclePrice;
              console.log(`[FLUID] Oracle price (raw): ${oraclePrice.toString()}`);
            } catch (vaultDataError) {
              console.warn(`[FLUID] Failed to get vault rate data for NFT ${nftId}, using fallback rates`, vaultDataError);
            }

            positions.push({
              nftId,
              supply: userPosition.supply,
              borrow: userPosition.borrow,
            });

            // Use KNOWN_VAULTS for token addresses and live (or fallback) rates
            vaultsData.push({
              vault: vaultAddress,
              supplyToken: knownVault.supplyToken,
              borrowToken: knownVault.borrowToken,
              collateralFactor: knownVault.collateralFactor,
              liquidationThreshold: knownVault.liquidationThreshold,
              supplyRate: liveSupplyRate,
              borrowRate: liveBorrowRate,
              oraclePrice,
            });

          } catch (positionError) {
            // Position fetch failed — skip this NFT entirely rather than pushing zeros
            console.error(`[FLUID] Error fetching position data for NFT ${nftId}:`, positionError);
          }

        } else {
          console.log(`[FLUID] NFT ${nftId} is in unknown vault: ${vaultAddress}`);
        }
      } catch (error) {
        console.error(`[FLUID] Error processing NFT ${nftId}:`, error);
      }
    }

    return { positions, vaultsData };
  } catch (error) {
    console.error("[FLUID] Error in getUserPositions:", error);
    return { positions: [], vaultsData: [] };
  }
}


/**
 * Get a specific position by NFT ID from the Fluid VaultResolver
 * @param publicClient - The viem PublicClient instance
 * @param nftId - The NFT ID of the position
 * @returns Object containing the position and its corresponding vault data
 */
export async function getPositionByNftId(
  publicClient: PublicClient,
  nftId: bigint
): Promise<FluidPositionWithVault | null> {
  try {
    // Call 1: Get vault address for this NFT
    const vaultAddress = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: SIMPLE_RESOLVER_ABI,
      functionName: "vaultByNftId",
      args: [nftId],
    });

    // Check if this is a known vault type
    const knownVault = KNOWN_VAULTS[vaultAddress.toLowerCase()];
    if (!knownVault) {
      console.log(`[FLUID] Vault ${vaultAddress} is not in known vaults list`);
      return null;
    }

    // Call 2: Use POSITION_BY_NFT_ABI for correct supply/borrow values
    const userPosition = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: POSITION_BY_NFT_ABI,
      functionName: "positionByNftId",
      args: [nftId],
    });

    // Call 3: Use getVaultEntireData to get live borrow rate
    // FLUID_VAULT_RESOLVER_ABI is configured for getVaultEntireData function
    const vaultData = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: FLUID_VAULT_RESOLVER_ABI,
      functionName: "getVaultEntireData",
      args: [vaultAddress],
    });

    // Extract borrowRateVault from exchangePricesAndRates nested struct
    // borrowRateVault is in basis points (10000 = 100%, so 515 = 5.15%)
    const liveBorrowRateBps = vaultData.exchangePricesAndRates.borrowRateVault;
    const liveSupplyRateBps = vaultData.exchangePricesAndRates.supplyRateVault;

    // Convert basis points to per-second rate scaled by 1e18 (to match our rateToApr function)
    const liveBorrowRate = bpsRateToPerSecondRate(liveBorrowRateBps);
    const liveSupplyRate = bpsRateToPerSecondRate(liveSupplyRateBps);

    // Calculate APR for logging (directly from basis points)
    const aprPercent = bpsRateToAprPercentage(liveBorrowRateBps);
    console.log(`[FLUID] getPositionByNftId live borrow rate (bps): ${liveBorrowRateBps.toString()} (${aprPercent.toFixed(2)}% APR)`);

    // Extract oracle price from configs struct
    const oraclePrice = vaultData.configs.oraclePrice;
    console.log(`[FLUID] getPositionByNftId oracle price (raw): ${oraclePrice.toString()}`);

    const position: FluidUserPosition = {
      nftId,
      supply: userPosition.supply,
      borrow: userPosition.borrow,
    };

    // Use KNOWN_VAULTS for token addresses but LIVE rates and oracle price from resolver
    const positionVaultData: FluidVaultData = {
      vault: vaultAddress,
      supplyToken: knownVault.supplyToken,
      borrowToken: knownVault.borrowToken,
      collateralFactor: knownVault.collateralFactor,
      liquidationThreshold: knownVault.liquidationThreshold,
      supplyRate: liveSupplyRate,
      borrowRate: liveBorrowRate,
      oraclePrice,
    };

    return { position, vaultData: positionVaultData };



  } catch (error) {
    console.error("[FLUID] Error in getPositionByNftId:", error);
    return null;
  }
}


/**
 * Get all positions for a user with their vault data paired together
 * @param publicClient - The viem PublicClient instance
 * @param user - The user's wallet address
 * @returns Array of positions paired with their vault data
 */
export async function getUserPositionsWithVaultData(
  publicClient: PublicClient,
  user: Address
): Promise<FluidPositionWithVault[]> {
  const { positions, vaultsData } = await getUserPositions(publicClient, user);

  // Pair each position with its corresponding vault data
  return positions.map((position, index) => ({
    position,
    vaultData: vaultsData[index],
  }));
}

// ============ Encode functions for sponsored transactions ============

/**
 * Encode the operate function call for a Fluid vault
 * This is the core encoding function used by all position operations
 *
 * @param nftId - Position NFT ID (use 0 to create new position)
 * @param collateralDelta - Collateral change (+ve = add, -ve = withdraw)
 * @param debtDelta - Debt change (+ve = borrow, -ve = repay)
 * @param recipient - Address to receive withdrawn tokens
 * @returns Encoded function data as hex string
 */
export function encodeFluidOperateData(
  nftId: bigint,
  collateralDelta: bigint,
  debtDelta: bigint,
  recipient: Address
): Hex {
  return encodeFunctionData({
    abi: FLUID_VAULT_ABI,
    functionName: "operate",
    args: [nftId, collateralDelta, debtDelta, recipient],
  });
}

/**
 * Encode a supply (add collateral) operation
 * @param nftId - Position NFT ID
 * @param amount - Amount of collateral to add (positive value)
 * @param recipient - Address (typically the user's address)
 */
export function encodeFluidSupply(
  nftId: bigint,
  amount: bigint,
  recipient: Address
): Hex {
  return encodeFluidOperateData(nftId, amount, BigInt(0), recipient);
}

/**
 * Encode a withdraw collateral operation
 * @param nftId - Position NFT ID
 * @param amount - Amount of collateral to withdraw (positive value, will be negated)
 * @param recipient - Address to receive the withdrawn collateral
 * @throws Error if nftId is 0 or negative
 * @throws Error if amount is 0 or negative
 * @throws Error if recipient is zero address
 */
export function encodeFluidWithdraw(
  nftId: bigint,
  amount: bigint,
  recipient: Address
): Hex {
  // Validate nftId - must be positive (0 is only valid for creating new positions, not withdrawing)
  if (nftId <= 0n) {
    throw new Error("nftId must be greater than 0");
  }

  // Validate amount - must be positive (will be negated internally)
  if (amount <= 0n) {
    throw new Error("amount must be greater than 0");
  }

  // Validate recipient - cannot be zero address
  if (recipient === "0x0000000000000000000000000000000000000000") {
    throw new Error("recipient cannot be zero address");
  }

  return encodeFluidOperateData(nftId, -amount, BigInt(0), recipient);
}

/**
 * Encode a borrow operation
 * @param nftId - Position NFT ID
 * @param amount - Amount to borrow (positive value)
 * @param recipient - Address to receive the borrowed tokens
 */
export function encodeFluidBorrow(
  nftId: bigint,
  amount: bigint,
  recipient: Address
): Hex {
  return encodeFluidOperateData(nftId, BigInt(0), amount, recipient);
}

/**
 * Encode a repay debt operation
 * @param nftId - Position NFT ID
 * @param amount - Amount to repay (positive value, will be negated)
 * @param recipient - Address (typically the user's address)
 */
export function encodeFluidRepay(
  nftId: bigint,
  amount: bigint,
  recipient: Address
): Hex {
  return encodeFluidOperateData(nftId, BigInt(0), -amount, recipient);
}

/**
 * Encode a combined supply collateral + borrow operation
 * Used for creating new positions or adding to existing positions in a single transaction
 * 
 * @param nftId - Position NFT ID (use 0 to create new position)
 * @param collateralAmount - Amount of collateral to add (positive value)
 * @param borrowAmount - Amount to borrow (positive value)
 * @param recipient - Address to receive borrowed tokens
 * @returns Encoded function data as hex string
 */
export function encodeFluidSupplyAndBorrow(
  nftId: bigint,
  collateralAmount: bigint,
  borrowAmount: bigint,
  recipient: Address
): Hex {
  return encodeFluidOperateData(nftId, collateralAmount, borrowAmount, recipient);
}

/**
 * Get XAUT vault configuration without requiring an existing position
 * Used by NewLoanSimulatorModal to calculate max borrow amounts for new positions
 *
 * @param publicClient - The viem PublicClient instance (optional, uses fallback if not provided)
 * @returns Vault config with maxLtv, liquidationRatio, and borrowApr
 */
export async function getXautVaultConfig(
  publicClient?: PublicClient
): Promise<{
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
}> {
  const knownVault = KNOWN_VAULTS[XAUT_USDT_VAULT.toLowerCase()];

  // Fallback values from KNOWN_VAULTS (75% LTV, 80% liquidation, ~2% APR)
  const fallbackConfig = {
    maxLtv: Number(knownVault.collateralFactor) / 100, // 7500 -> 75
    liquidationRatio: Number(knownVault.liquidationThreshold) / 100, // 8000 -> 80
    borrowApr: 2.0, // ~2% APR fallback
  };

  if (!publicClient) {
    console.log("[FLUID] No publicClient, using fallback vault config");
    return fallbackConfig;
  }

  try {
    // Fetch live rates from the vault resolver
    const vaultData = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: FLUID_VAULT_RESOLVER_ABI,
      functionName: "getVaultEntireData",
      args: [XAUT_USDT_VAULT as Address],
    });

    // Extract live borrow rate
    const liveBorrowRateBps = vaultData.exchangePricesAndRates.borrowRateVault;
    const borrowApr = bpsRateToAprPercentage(liveBorrowRateBps);

    console.log(`[FLUID] getXautVaultConfig live borrow rate: ${borrowApr.toFixed(2)}% APR`);

    return {
      maxLtv: Number(knownVault.collateralFactor) / 100,
      liquidationRatio: Number(knownVault.liquidationThreshold) / 100,
      borrowApr,
    };
  } catch (error) {
    console.error("[FLUID] Error fetching vault config, using fallback:", error);
    return fallbackConfig;
  }
}

/**
 * Convert Fluid's raw oracle price to USD
 * Fluid uses 27 decimals for oracle prices (price * 10^27)
 *
 * @param rawOraclePrice - Oracle price in 27-decimal format
 * @returns Price in USD as a number
 */
export function convertOraclePriceToUsd(rawOraclePrice: bigint): number {
  return Number(rawOraclePrice) / 10 ** ORACLE_PRICE_DECIMALS;
}

/**
 * Get the Fluid oracle price for the XAUT/USDT vault
 * This is the on-chain price used by Fluid for health calculations
 *
 * @param publicClient - The viem PublicClient instance
 * @returns Oracle price in USD, or null if fetching fails
 */
export async function getFluidOraclePrice(
  publicClient: PublicClient
): Promise<{ priceUsd: number; rawPrice: bigint } | null> {
  try {
    const vaultData = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: FLUID_VAULT_RESOLVER_ABI,
      functionName: "getVaultEntireData",
      args: [XAUT_USDT_VAULT as Address],
    });

    const rawOraclePrice = vaultData.configs.oraclePrice;
    const priceUsd = convertOraclePriceToUsd(rawOraclePrice);

    console.log(`[FLUID] getFluidOraclePrice: raw=${rawOraclePrice.toString()}, USD=${priceUsd.toFixed(2)}`);

    return { priceUsd, rawPrice: rawOraclePrice };
  } catch (error) {
    console.error("[FLUID] Error fetching oracle price:", error);
    return null;
  }
}

// ============ Debug Functions for Passkey Withdrawal Investigation ============

/**
 * Debug function to compare encoding between different operations.
 * Call this from browser console to verify int256 encoding is correct.
 */
export function debugFluidEncoding(
  nftId: bigint = 9839n,
  amount: bigint = 4948n,
  recipient: Address = "0x02Ce834eE022Af1f76b263a600a98c588f8557e" as Address
): void {
  console.log("=".repeat(60));
  console.log("[DEBUG] Comparing Fluid operation encodings");
  console.log("=".repeat(60));
  console.log("[DEBUG] NFT ID:", nftId.toString());
  console.log("[DEBUG] Amount:", amount.toString());
  console.log("[DEBUG] Recipient:", recipient);

  // Supply (works): positive collateral
  const supplyData = encodeFluidOperateData(nftId, amount, 0n, recipient);
  console.log("[DEBUG] SUPPLY colDelta:", "0x" + supplyData.slice(74, 138));

  // Withdraw (fails): negative collateral
  const withdrawData = encodeFluidOperateData(nftId, -amount, 0n, recipient);
  console.log("[DEBUG] WITHDRAW colDelta:", "0x" + withdrawData.slice(74, 138));

  // Verify two's complement
  const maxUint256 = BigInt(2) ** BigInt(256);
  const negativeVal = BigInt("0x" + withdrawData.slice(74, 138));
  const expected = maxUint256 - amount;
  console.log("[DEBUG] Two's complement match:", negativeVal === expected ? "✅" : "❌");
  console.log("=".repeat(60));
}

/**
 * Test withdrawal simulation directly via viem (bypasses Privy).
 */
export async function debugWithdrawSimulation(
  publicClient: PublicClient,
  nftId: bigint,
  amount: bigint,
  userAddress: Address
): Promise<{ success: boolean; error?: string }> {
  console.log("[DEBUG] Testing withdrawal via direct viem simulation");
  try {
    const result = await publicClient.simulateContract({
      address: XAUT_USDT_VAULT as Address,
      abi: FLUID_VAULT_ABI,
      functionName: "operate",
      args: [nftId, -amount, 0n, userAddress],
      account: userAddress,
    });
    console.log("[DEBUG] Simulation SUCCESS!", result);
    return { success: true };
  } catch (error) {
    console.error("[DEBUG] Simulation FAILED!", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export { VAULT_RESOLVER_ADDRESS, XAUT_USDT_VAULT, KNOWN_VAULTS };
