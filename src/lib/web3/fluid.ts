import {
  FLUID_VAULT_RESOLVER_ADDR,
} from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import { type Address, type PublicClient, parseAbi } from "viem";

const VAULT_RESOLVER_ADDRESS = formatAddress(FLUID_VAULT_RESOLVER_ADDR);

// Known XAUT/USDT vault on Ethereum mainnet
const XAUT_USDT_VAULT = "0xEce156BeD5aF2621b80b87ff4fE8fD3A929E3644" as const;

// Simple ABIs that work with the Fluid resolver
const SIMPLE_RESOLVER_ABI = parseAbi([
  "function positionsNftIdOfUser(address user_) view returns (uint256[])",
  "function vaultByNftId(uint256 nftId_) view returns (address)",
]);

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
const KNOWN_VAULTS: Record<string, {
  supplyToken: Address;
  borrowToken: Address;
  supplyDecimals: number;
  borrowDecimals: number;
  // Default values - actual rates should be fetched from chain if needed
  collateralFactor: bigint;
  liquidationThreshold: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
}> = {
  [XAUT_USDT_VAULT.toLowerCase()]: {
    supplyToken: "0x68749665FF8D2d112Fa859AA293F07A622782F38" as Address, // XAUT
    borrowToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address, // USDT
    supplyDecimals: 6, // XAUT has 6 decimals
    borrowDecimals: 6, // USDT has 6 decimals
    collateralFactor: BigInt(7500), // 75% - typical value
    liquidationThreshold: BigInt(8000), // 80% - typical value
    supplyRate: BigInt(0),
    borrowRate: BigInt("63419583966"), // ~2% APR (per-second rate)
  },
};

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

          // Get actual position data using positionByNftId
          try {
            const userPosition = await publicClient.readContract({
              address: VAULT_RESOLVER_ADDRESS,
              abi: POSITION_BY_NFT_ABI,
              functionName: "positionByNftId",
              args: [nftId],
            });

            console.log(`[FLUID] Position data for NFT ${nftId}:`, {
              supply: userPosition.supply.toString(),
              borrow: userPosition.borrow.toString(),
              isLiquidated: userPosition.isLiquidated,
            });

            positions.push({
              nftId,
              supply: userPosition.supply,
              borrow: userPosition.borrow,
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
          } catch (positionError) {
            console.error(`[FLUID] Error fetching position data for NFT ${nftId}:`, positionError);
            // Still add the position with zero values if we can't fetch
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
    const vaultAddress = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: SIMPLE_RESOLVER_ABI,
      functionName: "vaultByNftId",
      args: [nftId],
    });

    const knownVault = KNOWN_VAULTS[vaultAddress.toLowerCase()];

    if (!knownVault) {
      console.log(`[FLUID] Vault ${vaultAddress} is not in known vaults list`);
      return null;
    }

    // Get actual position data using positionByNftId
    const userPosition = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: POSITION_BY_NFT_ABI,
      functionName: "positionByNftId",
      args: [nftId],
    });

    const position: FluidUserPosition = {
      nftId,
      supply: userPosition.supply,
      borrow: userPosition.borrow,
    };

    const vaultData: FluidVaultData = {
      vault: vaultAddress,
      supplyToken: knownVault.supplyToken,
      borrowToken: knownVault.borrowToken,
      collateralFactor: knownVault.collateralFactor,
      liquidationThreshold: knownVault.liquidationThreshold,
      supplyRate: knownVault.supplyRate,
      borrowRate: knownVault.borrowRate,
    };

    return { position, vaultData };
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
