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

// ABI that returns vaultData with full nested structure including exchangePricesAndRates
const RESOLVER_POSITION_WITH_VAULT_ABI = [
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
      {
        name: "vaultData_",
        type: "tuple",
        components: [
          { name: "vault", type: "address" },
          {
            name: "constantVariables", type: "tuple", components: [
              { name: "liquidity", type: "address" },
              { name: "factory", type: "address" },
              { name: "adminImplementation", type: "address" },
              { name: "secondaryImplementation", type: "address" },
              { name: "supplyToken", type: "address" },
              { name: "borrowToken", type: "address" },
              { name: "supplyDecimals", type: "uint8" },
              { name: "borrowDecimals", type: "uint8" },
              { name: "vaultId", type: "uint256" },
              { name: "liquiditySupplyExchangePriceSlot", type: "bytes32" },
              { name: "liquidityBorrowExchangePriceSlot", type: "bytes32" },
              { name: "liquidityUserSupplySlot", type: "bytes32" },
              { name: "liquidityUserBorrowSlot", type: "bytes32" },
            ]
          },
          {
            name: "configs", type: "tuple", components: [
              { name: "supplyRateMagnifier", type: "uint16" },
              { name: "borrowRateMagnifier", type: "uint16" },
              { name: "collateralFactor", type: "uint16" },
              { name: "liquidationThreshold", type: "uint16" },
              { name: "liquidationMaxLimit", type: "uint16" },
              { name: "withdrawalGap", type: "uint16" },
              { name: "liquidationPenalty", type: "uint16" },
              { name: "borrowFee", type: "uint16" },
              { name: "oracle", type: "address" },
              { name: "oraclePriceOperate", type: "uint256" },
              { name: "oraclePriceLiquidate", type: "uint256" },
              { name: "rebalancer", type: "address" },
            ]
          },
          {
            name: "exchangePricesAndRates", type: "tuple", components: [
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
              { name: "supplyRateVault", type: "int256" },
              { name: "borrowRateVault", type: "int256" },
              { name: "rewardsRate", type: "int256" },
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
              { name: "maxBorrowLimitUtilization", type: "uint256" },
            ]
          },
          {
            name: "vaultState", type: "tuple", components: [
              { name: "topTick", type: "int256" },
              { name: "currentBranch", type: "uint256" },
              { name: "totalBranch", type: "uint256" },
              { name: "totalSupply", type: "uint256" },
              { name: "totalBorrow", type: "uint256" },
              { name: "totalPositions", type: "uint256" },
              { name: "currentBranchState", type: "int256" },
            ]
          },
          {
            name: "liquidityUserSupplyData", type: "tuple", components: [
              { name: "isAllowed", type: "bool" },
              { name: "supply", type: "uint256" },
              { name: "withdrawalLimit", type: "uint256" },
              { name: "lastUpdateTimestamp", type: "uint256" },
              { name: "expandPercent", type: "uint256" },
              { name: "expandDuration", type: "uint256" },
              { name: "baseWithdrawalLimit", type: "uint256" },
              { name: "withdrawableUntilLimit", type: "uint256" },
              { name: "withdrawable", type: "uint256" },
            ]
          },
          {
            name: "liquidityUserBorrowData", type: "tuple", components: [
              { name: "isAllowed", type: "bool" },
              { name: "borrow", type: "uint256" },
              { name: "borrowLimit", type: "uint256" },
              { name: "lastUpdateTimestamp", type: "uint256" },
              { name: "expandPercent", type: "uint256" },
              { name: "expandDuration", type: "uint256" },
              { name: "baseBorrowLimit", type: "uint256" },
              { name: "maxBorrowLimit", type: "uint256" },
              { name: "borrowableUntilLimit", type: "uint256" },
              { name: "borrowable", type: "uint256" },
            ]
          },
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
      // First get basic position data
      const userPosition = await publicClient.readContract({
        address: VAULT_RESOLVER_ADDRESS,
        abi: RESOLVER_POSITION_ABI,
        functionName: "positionByNftId",
        args: [xautNftId],
      });
      console.log("[DEBUG FLUID] Position result:", userPosition);

      // Try getRateRaw for simpler rate data
      const GET_RATE_RAW_ABI = parseAbi([
        "function getRateRaw(address vault_) view returns (uint256)",
      ]);

      const rateRaw = await publicClient.readContract({
        address: VAULT_RESOLVER_ADDRESS,
        abi: GET_RATE_RAW_ABI,
        functionName: "getRateRaw",
        args: [XAUT_VAULT_ADDRESS],
      });
      console.log("[DEBUG FLUID] rateRaw:", rateRaw.toString());

      // The rate is packed - try to decode it
      // Rate format is typically packed bits, let's see the raw value
      const rateHex = rateRaw.toString(16).padStart(64, '0');
      console.log("[DEBUG FLUID] rateRaw hex:", rateHex);

      // Use getVaultEntireData to get vault data including borrowRateVault
      // ABI built from Etherscan verified contract source
      const GET_VAULT_ENTIRE_DATA_ABI = [
        {
          inputs: [{ name: "vault_", type: "address" }],
          name: "getVaultEntireData",
          outputs: [
            {
              name: "vaultData_",
              type: "tuple",
              components: [
                { name: "vault", type: "address" },
                // ConstantViews struct (from IFluidVaultT1)
                {
                  name: "constantVariables", type: "tuple", components: [
                    { name: "liquidity", type: "address" },
                    { name: "factory", type: "address" },
                    { name: "adminImplementation", type: "address" },
                    { name: "secondaryImplementation", type: "address" },
                    { name: "supplyToken", type: "address" },
                    { name: "borrowToken", type: "address" },
                    { name: "supplyDecimals", type: "uint8" },
                    { name: "borrowDecimals", type: "uint8" },
                    { name: "vaultId", type: "uint256" },
                    { name: "liquiditySupplyExchangePriceSlot", type: "bytes32" },
                    { name: "liquidityBorrowExchangePriceSlot", type: "bytes32" },
                    { name: "liquidityUserSupplySlot", type: "bytes32" },
                    { name: "liquidityUserBorrowSlot", type: "bytes32" },
                  ]
                },
                // Configs struct (from Etherscan source)
                {
                  name: "configs", type: "tuple", components: [
                    { name: "supplyRateMagnifier", type: "uint16" },
                    { name: "borrowRateMagnifier", type: "uint16" },
                    { name: "collateralFactor", type: "uint16" },
                    { name: "liquidationThreshold", type: "uint16" },
                    { name: "liquidationMaxLimit", type: "uint16" },
                    { name: "withdrawalGap", type: "uint16" },
                    { name: "liquidationPenalty", type: "uint16" },
                    { name: "borrowFee", type: "uint16" },
                    { name: "oracle", type: "address" },
                    { name: "oraclePrice", type: "uint256" },
                    { name: "rebalancer", type: "address" },
                  ]
                },
                // ExchangePricesAndRates struct (from Etherscan source - note order)
                {
                  name: "exchangePricesAndRates", type: "tuple", components: [
                    { name: "lastStoredLiquiditySupplyExchangePrice", type: "uint256" },
                    { name: "lastStoredLiquidityBorrowExchangePrice", type: "uint256" },
                    { name: "lastStoredVaultSupplyExchangePrice", type: "uint256" },
                    { name: "lastStoredVaultBorrowExchangePrice", type: "uint256" },
                    { name: "liquiditySupplyExchangePrice", type: "uint256" },
                    { name: "liquidityBorrowExchangePrice", type: "uint256" },
                    { name: "vaultSupplyExchangePrice", type: "uint256" },
                    { name: "vaultBorrowExchangePrice", type: "uint256" },
                    { name: "supplyRateVault", type: "uint256" },
                    { name: "borrowRateVault", type: "uint256" },
                    { name: "supplyRateLiquidity", type: "uint256" },
                    { name: "borrowRateLiquidity", type: "uint256" },
                    { name: "rewardsRate", type: "uint256" },
                  ]
                },
                // TotalSupplyAndBorrow struct
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
                // LimitsAndAvailability struct (7 fields, not 8)
                {
                  name: "limitsAndAvailability", type: "tuple", components: [
                    { name: "withdrawLimit", type: "uint256" },
                    { name: "withdrawableUntilLimit", type: "uint256" },
                    { name: "withdrawable", type: "uint256" },
                    { name: "borrowLimit", type: "uint256" },
                    { name: "borrowableUntilLimit", type: "uint256" },
                    { name: "borrowable", type: "uint256" },
                    { name: "minimumBorrowing", type: "uint256" },
                  ]
                },
                // VaultState struct with nested CurrentBranchState
                {
                  name: "vaultState", type: "tuple", components: [
                    { name: "totalPositions", type: "uint256" },
                    { name: "topTick", type: "int256" },
                    { name: "currentBranch", type: "uint256" },
                    { name: "totalBranch", type: "uint256" },
                    { name: "totalBorrow", type: "uint256" },
                    { name: "totalSupply", type: "uint256" },
                    { name: "currentBranchState", type: "tuple", components: [
                      { name: "status", type: "uint256" },
                      { name: "minimaTick", type: "int256" },
                      { name: "debtFactor", type: "uint256" },
                      { name: "partials", type: "uint256" },
                      { name: "debtLiquidity", type: "uint256" },
                      { name: "baseBranchId", type: "uint256" },
                      { name: "baseBranchMinima", type: "int256" },
                    ]},
                  ]
                },
                // UserSupplyData struct (9 fields)
                {
                  name: "liquidityUserSupplyData", type: "tuple", components: [
                    { name: "modeWithInterest", type: "bool" },
                    { name: "supply", type: "uint256" },
                    { name: "withdrawalLimit", type: "uint256" },
                    { name: "lastUpdateTimestamp", type: "uint256" },
                    { name: "expandPercent", type: "uint256" },
                    { name: "expandDuration", type: "uint256" },
                    { name: "baseWithdrawalLimit", type: "uint256" },
                    { name: "withdrawableUntilLimit", type: "uint256" },
                    { name: "withdrawable", type: "uint256" },
                  ]
                },
                // UserBorrowData struct (10 fields)
                {
                  name: "liquidityUserBorrowData", type: "tuple", components: [
                    { name: "modeWithInterest", type: "bool" },
                    { name: "borrow", type: "uint256" },
                    { name: "borrowLimit", type: "uint256" },
                    { name: "lastUpdateTimestamp", type: "uint256" },
                    { name: "expandPercent", type: "uint256" },
                    { name: "expandDuration", type: "uint256" },
                    { name: "baseBorrowLimit", type: "uint256" },
                    { name: "maxBorrowLimit", type: "uint256" },
                    { name: "borrowableUntilLimit", type: "uint256" },
                    { name: "borrowable", type: "uint256" },
                  ]
                },
              ],
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ] as const;

      // Try to get full vault data, but fall back to rateRaw if struct decoding fails
      let borrowRateVault: bigint | null = null;
      let borrowRateLiquidity: bigint | null = null;
      let collateralFactor: number | null = null;
      let liquidationThreshold: number | null = null;
      let vaultDataError: string | null = null;

      try {
        const vaultData = await publicClient.readContract({
          address: VAULT_RESOLVER_ADDRESS,
          abi: GET_VAULT_ENTIRE_DATA_ABI,
          functionName: "getVaultEntireData",
          args: [XAUT_VAULT_ADDRESS],
        });

        borrowRateVault = vaultData.exchangePricesAndRates.borrowRateVault;
        borrowRateLiquidity = vaultData.exchangePricesAndRates.borrowRateLiquidity;
        collateralFactor = vaultData.configs.collateralFactor;
        liquidationThreshold = vaultData.configs.liquidationThreshold;

        console.log("[DEBUG FLUID] borrowRateVault (ray):", borrowRateVault.toString());
        console.log("[DEBUG FLUID] borrowRateLiquidity:", borrowRateLiquidity.toString());
      } catch (vaultError) {
        vaultDataError = vaultError instanceof Error ? vaultError.message : "Unknown error";
        console.log("[DEBUG FLUID] getVaultEntireData failed:", vaultDataError);
      }

      // Calculate APR if we have the rate
      // borrowRateVault is in basis points where 10000 = 100%
      // So 515 = 5.15% APR
      let aprPercent: number | null = null;
      if (borrowRateVault !== null) {
        const borrowRateNum = Number(borrowRateVault);
        aprPercent = borrowRateNum / 100; // Convert basis points to percentage
        console.log("[DEBUG FLUID] APR from basis points:", aprPercent.toFixed(2), "%");
      }

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
        rateRaw: {
          value: rateRaw.toString(),
          hex: rateHex,
        },
        vaultData: borrowRateVault !== null ? {
          collateralFactor: collateralFactor?.toString(),
          liquidationThreshold: liquidationThreshold?.toString(),
          borrowRateVault: borrowRateVault.toString(),
          borrowRateLiquidity: borrowRateLiquidity?.toString(),
        } : null,
        vaultDataError,
        aprCalculation: borrowRateVault !== null ? {
          borrowRateVaultBps: borrowRateVault.toString(),
          aprPercent: aprPercent?.toFixed(2),
        } : null,
        expectedApr: "5.16% (from Fluid UI)",
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
