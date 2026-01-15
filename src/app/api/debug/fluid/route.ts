import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";
import {
  FLUID_VAULT_RESOLVER_ADDR,
} from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";

const VAULT_RESOLVER_ADDRESS = formatAddress(FLUID_VAULT_RESOLVER_ADDR);
const VAULT_FACTORY_ADDRESS = "0x324c5dc1fc42c7a4d43d92df1eba58a54d13bf2d" as const; // FluidVaultFactory

// Simple ABIs for getting NFT IDs and vault addresses
const RESOLVER_ABI = parseAbi([
  "function positionsNftIdOfUser(address user_) view returns (uint256[])",
  "function vaultByNftId(uint256 nftId_) view returns (address)",
]);

// XAUT vault address we found
const XAUT_VAULT_ADDRESS = "0xEce156BeD5aF2621b80b87ff4fE8fD3A929E3644" as const;

// Extended resolver ABI - only decode UserPosition, skip complex VaultEntireData
const RESOLVER_POSITION_ABI = [
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  console.log("[DEBUG FLUID] Testing Fluid position for:", address);
  console.log("[DEBUG FLUID] Using resolver:", VAULT_RESOLVER_ADDRESS);
  console.log("[DEBUG FLUID] XAUT Vault:", XAUT_VAULT_ADDRESS);

  try {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    // Step 1: Get NFT IDs for user
    console.log("[DEBUG FLUID] Step 1: Getting NFT IDs for user...");
    const nftIds = await publicClient.readContract({
      address: VAULT_RESOLVER_ADDRESS,
      abi: RESOLVER_ABI,
      functionName: "positionsNftIdOfUser",
      args: [address as `0x${string}`],
    });
    console.log("[DEBUG FLUID] Found NFT IDs:", nftIds.map(id => id.toString()));

    if (nftIds.length === 0) {
      return NextResponse.json({
        address,
        totalPositions: 0,
        message: "No NFT positions found for this user",
      });
    }

    // Step 2: For each NFT, check if it belongs to the XAUT vault
    console.log("[DEBUG FLUID] Step 2: Finding XAUT position...");
    let xautNftId: bigint | null = null;

    for (const nftId of nftIds) {
      const vaultAddress = await publicClient.readContract({
        address: VAULT_RESOLVER_ADDRESS,
        abi: RESOLVER_ABI,
        functionName: "vaultByNftId",
        args: [nftId],
      });
      console.log(`[DEBUG FLUID] NFT ${nftId} -> Vault: ${vaultAddress}`);

      if (vaultAddress.toLowerCase() === XAUT_VAULT_ADDRESS.toLowerCase()) {
        xautNftId = nftId;
        console.log("[DEBUG FLUID] Found XAUT position! NFT ID:", nftId.toString());
        break;
      }
    }

    if (!xautNftId) {
      return NextResponse.json({
        address,
        totalPositions: nftIds.length,
        xautPosition: null,
        message: "No XAUT vault position found",
        nftIds: nftIds.map(id => id.toString()),
      });
    }

    // Step 3: Get position data from the RESOLVER (not the vault directly)
    console.log("[DEBUG FLUID] Step 3: Getting XAUT position data from resolver...");
    try {
      const userPosition = await publicClient.readContract({
        address: VAULT_RESOLVER_ADDRESS,
        abi: RESOLVER_POSITION_ABI,
        functionName: "positionByNftId",
        args: [xautNftId],
      });
      console.log("[DEBUG FLUID] Position result:", userPosition);

      return NextResponse.json({
        address,
        resolverAddress: VAULT_RESOLVER_ADDRESS,
        xautVault: XAUT_VAULT_ADDRESS,
        xautPosition: {
          nftId: userPosition.nftId.toString(),
          owner: userPosition.owner,
          isLiquidated: userPosition.isLiquidated,
          supply: userPosition.supply.toString(),
          borrow: userPosition.borrow.toString(),
          dustBorrow: userPosition.dustBorrow.toString(),
          supplyToken: ETHEREUM_TOKEN_ADDRESSES.XAUT,
          borrowToken: ETHEREUM_TOKEN_ADDRESSES.USDT,
        },
        totalPositions: nftIds.length,
      });
    } catch (posError) {
      console.error("[DEBUG FLUID] Failed to get XAUT position data:", posError);
      return NextResponse.json({
        address,
        xautNftId: xautNftId.toString(),
        xautVault: XAUT_VAULT_ADDRESS,
        error: posError instanceof Error ? posError.message : "Unknown error",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[DEBUG FLUID] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
