import {
  FLUID_VAULT_RESOLVER_ADDR,
  FLUID_VAULT_RESOLVER_ABI,
} from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import { type Address, type PublicClient, parseAbi } from "viem";

const VAULT_RESOLVER_ADDRESS = formatAddress(FLUID_VAULT_RESOLVER_ADDR);

// Known XAUT/USDT vault on Ethereum mainnet
const XAUT_USDT_VAULT = "0xEce156BeD5aF2621b80b87ff4fE8fD3A929E3644" as const;

const SIMPLE_RESOLVER_ABI = parseAbi([
  "function positionsNftIdOfUser(address user_) view returns (uint256[])",
  "function vaultByNftId(uint256 nftId_) view returns (address)",
]);

// Alias for the positions by user ABI from config
const POSITIONS_BY_USER_ABI = FLUID_VAULT_RESOLVER_ABI;


// ABI for getVaultEntireData - returns comprehensive vault data including live borrow rate
// The borrowRateVault field is in "ray" format (1e27 = 100%)
const VAULT_ENTIRE_DATA_ABI = [
  {
    inputs: [{ name: "vault_", type: "address" }],
    name: "getVaultEntireData",
    outputs: [
      {
        name: "vaultData_",
        type: "tuple",
        components: [
          { name: "vault", type: "address" },
          { name: "vaultType", type: "uint256" },
          { name: "isSmartDebt", type: "bool" },
          { name: "isSmartCollateral", type: "bool" },
          {
            name: "supplyToken", type: "tuple", components: [
              { name: "token0", type: "address" },
              { name: "token1", type: "address" },
            ]
          },
          {
            name: "borrowToken", type: "tuple", components: [
              { name: "token0", type: "address" },
              { name: "token1", type: "address" },
            ]
          },
          {
            name: "constantVariables", type: "tuple", components: [
              { name: "supplyToken", type: "address" },
              { name: "borrowToken", type: "address" },
              { name: "factory", type: "address" },
              { name: "liquidityPool", type: "address" },
              { name: "operatorAuth", type: "address" },
              { name: "deployer", type: "address" },
              { name: "supply", type: "address" },
              { name: "borrow", type: "address" },
              { name: "supply2", type: "address" },
              { name: "borrow2", type: "address" },
              { name: "vaultId", type: "uint256" },
              { name: "supplyDecimals", type: "uint8" },
              { name: "borrowDecimals", type: "uint8" },
              { name: "vaultType", type: "uint256" },
            ]
          },
          {
            name: "configs", type: "tuple", components: [
              { name: "supplyRateVault", type: "uint16" },
              { name: "borrowRateVault", type: "uint16" },
              { name: "supplyExchangePriceSlot", type: "uint256" },
              { name: "borrowExchangePriceSlot", type: "uint256" },
              { name: "supplyRawSlot", type: "uint256" },
              { name: "borrowRawSlot", type: "uint256" },
              { name: "absorbedSupplySlot", type: "uint256" },
              { name: "absorbedBorrowSlot", type: "uint256" },
            ]
          },
          {
            name: "exchangePriceAndRates", type: "tuple", components: [
              { name: "lastStoredLiquiditySupplyExchangePrice", type: "uint256" },
              { name: "lastStoredLiquidityBorrowExchangePrice", type: "uint256" },
              { name: "lastStoredVaultSupplyExchangePrice", type: "uint256" },
              { name: "lastStoredVaultBorrowExchangePrice", type: "uint256" },
              { name: "liquiditySupplyExchangePrice", type: "uint256" },
              { name: "liquidityBorrowExchangePrice", type: "uint256" },
              { name: "vaultSupplyExchangePrice", type: "uint256" },
              { name: "vaultBorrowExchangePrice", type: "uint256" },
              { name: "supplyRateLiquidity", type: "uint256" },
              { name: "borrowRateLiquidity", type: "uint256" },
              { name: "supplyRateVault", type: "uint256" },
              { name: "borrowRateVault", type: "uint256" },
              { name: "rewardsOrFeeRateSupply", type: "int256" },
              { name: "rewardsOrFeeRateBorrow", type: "int256" },
            ]
          },
          {
            name: "totalSupplyAndBorrow", type: "tuple", components: [
              { name: "totalSupplyVault", type: "uint256" },
              { name: "totalBorrowVault", type: "uint256" },
              { name: "totalSupplyLiquidity", type: "uint256" },
              { name: "totalBorrowLiquidity", type: "uint256" },
              { name: "absorbedSupply", type: "uint256" },
              { name: "absorbedBorrow", type: "uint256" },
            ]
          },
          {
            name: "limitsAndAvailability", type: "tuple", components: [
              { name: "withdrawLimit", type: "int256" },
              { name: "withdrawableUntilLimit", type: "int256" },
              { name: "withdrawable", type: "int256" },
              { name: "borrowLimit", type: "int256" },
              { name: "borrowableUntilLimit", type: "int256" },
              { name: "borrowable", type: "int256" },
              { name: "borrowLimitUtilization", type: "uint256" },
              { name: "maxBorrowLimit", type: "int256" },
              { name: "maxBorrowLimitUtilization", type: "uint256" },
              { name: "baseBorrowLimit", type: "int256" },
            ]
          },
          { name: "vaultBranchSlot", type: "uint256" },
          { name: "oracleMapping", type: "uint256" },
          { name: "liquidationConfig", type: "uint256" },
          { name: "secondaryBranchData", type: "uint256" },
          { name: "absorbedDustDebt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

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
}

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
 * Fetch live borrow rate from VaultResolver using positionsByUser
 * The rate returned is already in the correct per-second format scaled by 1e18
 * @param publicClient - The viem PublicClient instance
 * @param user - The user's wallet address
 * @param vaultAddress - The vault address to get the rate for
 * @returns The borrow rate as bigint, or null if fetch fails
 */
export async function fetchLiveBorrowRateFromPositions(
  publicClient: PublicClient,
  user: Address,
  vaultAddress: Address
): Promise<{ borrowRate: bigint; supplyRate: bigint } | null> {
  console.log(`[FLUID] fetchLiveBorrowRateFromPositions called for vault: ${vaultAddress}`);

  try {
    // Use the positionsByUser function which returns vault data including borrowRate
    const result = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: POSITIONS_BY_USER_ABI,
      functionName: "positionsByUser",
      args: [user],
    });

    // result is [userPositions_[], vaultsData_[]]
    const [, vaultsData] = result;

    // Find the matching vault
    const matchingVault = vaultsData.find(
      (vault: any) => vault.vault.toLowerCase() === vaultAddress.toLowerCase()
    );

    if (matchingVault) {
      console.log(`[FLUID] Live borrow rate from positionsByUser: ${matchingVault.borrowRate.toString()}`);
      console.log(`[FLUID] Live supply rate from positionsByUser: ${matchingVault.supplyRate.toString()}`);

      // Calculate APR from the rate (per-second rate * seconds per year * 100)
      const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
      const aprPercent = (Number(matchingVault.borrowRate) / 1e18) * SECONDS_PER_YEAR * 100;
      console.log(`[FLUID] Calculated APR: ${aprPercent.toFixed(2)}%`);

      return {
        borrowRate: matchingVault.borrowRate,
        supplyRate: matchingVault.supplyRate
      };
    }

    console.log(`[FLUID] No matching vault found in positionsByUser response`);
    return null;
  } catch (error) {
    console.error(`[FLUID] Error fetching live borrow rate from positionsByUser:`);
    console.error(`[FLUID] Error details:`, error instanceof Error ? error.message : error);
    return null;
  }
}


/**
 * Convert Fluid ray rate (1e27 = 100%) to per-second rate scaled by 1e18
 * This matches the format used in the hardcoded fallback values
 * @param rayRate - Rate in ray format (1e27 = 100%)
 * @returns Rate in per-second format scaled by 1e18
 */
export function rayRateToPerSecondRate(rayRate: bigint): bigint {
  // Ray is already an annual rate scaled by 1e27
  // The hook's rateToApr function expects per-second rate scaled by 1e18
  // Annual rate in ray = rayRate / 1e27
  // Per-second = annual / (365 * 24 * 60 * 60)
  // Scaled by 1e18 = (rayRate / 1e27) / seconds_per_year * 1e18
  const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);
  // Simplified: (rayRate * 1e18) / (1e27 * SECONDS_PER_YEAR)
  return (rayRate * BigInt(10 ** 18)) / (BigInt(10 ** 27) * SECONDS_PER_YEAR);
}

/**
 * Convert Fluid ray rate to APR percentage directly
 * @param rayRate - Rate in ray format (1e27 = 100%)
 * @returns APR as a percentage number (e.g., 5.25 for 5.25%)
 */
export function rayRateToAprPercentage(rayRate: bigint): number {
  // Ray format: 1e27 = 100%
  // So APR% = (rayRate / 1e27) * 100
  return (Number(rayRate) / 1e27) * 100;
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

    // Cache for live rates per vault to avoid duplicate RPC calls
    const liveRatesCache: Map<string, { borrowRateRay: bigint; supplyRateRay: bigint } | null> = new Map();

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
            // Call 1: Use POSITION_BY_NFT_ABI for correct supply/borrow values
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

            // Call 2: Use FLUID_VAULT_RESOLVER_ABI to get live borrow rate from vaultData
            const resolverResult = await publicClient.readContract({
              address: VAULT_RESOLVER_ADDRESS,
              abi: FLUID_VAULT_RESOLVER_ABI,
              functionName: "positionByNftId",
              args: [nftId],
            });

            // resolverResult is [userPosition_, vaultData_] - we only need vaultData for rates
            const [, resolverVaultData] = resolverResult;
            const liveBorrowRate = resolverVaultData.borrowRate;
            const liveSupplyRate = resolverVaultData.supplyRate;

            // Calculate APR for logging
            const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
            const aprPercent = (Number(liveBorrowRate) / 1e18) * SECONDS_PER_YEAR * 100;
            console.log(`[FLUID] Live borrow rate from resolver: ${liveBorrowRate.toString()} (${aprPercent.toFixed(2)}% APR)`);

            positions.push({
              nftId,
              supply: userPosition.supply,
              borrow: userPosition.borrow,
            });

            // Use KNOWN_VAULTS for token addresses but LIVE rates from resolver
            vaultsData.push({
              vault: vaultAddress,
              supplyToken: knownVault.supplyToken,
              borrowToken: knownVault.borrowToken,
              collateralFactor: knownVault.collateralFactor,
              liquidationThreshold: knownVault.liquidationThreshold,
              supplyRate: liveSupplyRate,
              borrowRate: liveBorrowRate,
            });


          } catch (positionError) {
            console.error(`[FLUID] Error fetching position data for NFT ${nftId}:`, positionError);
            // Fallback to hardcoded values if the resolver call fails
            positions.push({
              nftId,
              supply: BigInt(0),
              borrow: BigInt(0),
            });

            vaultsData.push({
              vault: vaultAddress,
              supplyToken: knownVault.supplyToken,
              borrowToken: knownVault.borrowToken,
              collateralFactor: knownVault.collateralFactor,
              liquidationThreshold: knownVault.liquidationThreshold,
              supplyRate: knownVault.supplyRate,
              borrowRate: knownVault.borrowRate,
            });
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

    // Call 3: Use FLUID_VAULT_RESOLVER_ABI to get live borrow rate
    const resolverResult = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: FLUID_VAULT_RESOLVER_ABI,
      functionName: "positionByNftId",
      args: [nftId],
    });

    // resolverResult is [userPosition_, vaultData_] - we only need vaultData for rates
    const [, resolverVaultData] = resolverResult;

    // Calculate APR for logging
    const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
    const aprPercent = (Number(resolverVaultData.borrowRate) / 1e18) * SECONDS_PER_YEAR * 100;
    console.log(`[FLUID] getPositionByNftId live borrow rate: ${resolverVaultData.borrowRate.toString()} (${aprPercent.toFixed(2)}% APR)`);

    const position: FluidUserPosition = {
      nftId,
      supply: userPosition.supply,
      borrow: userPosition.borrow,
    };

    // Use KNOWN_VAULTS for token addresses but LIVE rates from resolver
    const positionVaultData: FluidVaultData = {
      vault: vaultAddress,
      supplyToken: knownVault.supplyToken,
      borrowToken: knownVault.borrowToken,
      collateralFactor: knownVault.collateralFactor,
      liquidationThreshold: knownVault.liquidationThreshold,
      supplyRate: resolverVaultData.supplyRate,
      borrowRate: resolverVaultData.borrowRate,
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

export { VAULT_RESOLVER_ADDRESS, XAUT_USDT_VAULT, KNOWN_VAULTS };
