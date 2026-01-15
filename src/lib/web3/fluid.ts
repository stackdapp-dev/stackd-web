import {
  FLUID_VAULT_RESOLVER_ABI,
  FLUID_VAULT_RESOLVER_ADDR,
} from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import { type Address, type PublicClient } from "viem";

const VAULT_RESOLVER_ADDRESS = formatAddress(FLUID_VAULT_RESOLVER_ADDR);

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

/**
 * Get all positions for a user from the Fluid VaultResolver
 * @param publicClient - The viem PublicClient instance
 * @param user - The user's wallet address
 * @returns Object containing arrays of user positions and corresponding vault data
 */
export async function getUserPositions(
  publicClient: PublicClient,
  user: Address
): Promise<FluidUserPositionsResult> {
  const result = (await publicClient.readContract({
    address: VAULT_RESOLVER_ADDRESS,
    abi: FLUID_VAULT_RESOLVER_ABI,
    functionName: "positionsByUser",
    args: [user],
  })) as [
    readonly { nftId: bigint; supply: bigint; borrow: bigint }[],
    readonly {
      vault: Address;
      supplyToken: Address;
      borrowToken: Address;
      collateralFactor: bigint;
      liquidationThreshold: bigint;
      supplyRate: bigint;
      borrowRate: bigint;
    }[]
  ];

  const positions: FluidUserPosition[] = result[0].map((pos) => ({
    nftId: pos.nftId,
    supply: pos.supply,
    borrow: pos.borrow,
  }));

  const vaultsData: FluidVaultData[] = result[1].map((vault) => ({
    vault: vault.vault,
    supplyToken: vault.supplyToken,
    borrowToken: vault.borrowToken,
    collateralFactor: vault.collateralFactor,
    liquidationThreshold: vault.liquidationThreshold,
    supplyRate: vault.supplyRate,
    borrowRate: vault.borrowRate,
  }));

  return { positions, vaultsData };
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
): Promise<FluidPositionWithVault> {
  const result = (await publicClient.readContract({
    address: VAULT_RESOLVER_ADDRESS,
    abi: FLUID_VAULT_RESOLVER_ABI,
    functionName: "positionByNftId",
    args: [nftId],
  })) as [
    { nftId: bigint; supply: bigint; borrow: bigint },
    {
      vault: Address;
      supplyToken: Address;
      borrowToken: Address;
      collateralFactor: bigint;
      liquidationThreshold: bigint;
      supplyRate: bigint;
      borrowRate: bigint;
    }
  ];

  const position: FluidUserPosition = {
    nftId: result[0].nftId,
    supply: result[0].supply,
    borrow: result[0].borrow,
  };

  const vaultData: FluidVaultData = {
    vault: result[1].vault,
    supplyToken: result[1].supplyToken,
    borrowToken: result[1].borrowToken,
    collateralFactor: result[1].collateralFactor,
    liquidationThreshold: result[1].liquidationThreshold,
    supplyRate: result[1].supplyRate,
    borrowRate: result[1].borrowRate,
  };

  return { position, vaultData };
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

export { VAULT_RESOLVER_ADDRESS };
