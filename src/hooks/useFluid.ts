import { getTokenMetadata } from "@/constants/Tokens";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
import {
  getUserPositions,
  type FluidUserPosition,
  type FluidVaultData,
} from "@/lib/web3/fluid";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { Address, PublicClient } from "viem";
import { formatUnits } from "viem";

// Token symbols used for collateral in Fluid
const COLLATERAL_TOKEN = "XAUT";

// Supported borrow tokens for XAUT collateral vaults
const SUPPORTED_BORROW_TOKENS = {
  [ETHEREUM_TOKEN_ADDRESSES.USDC.toLowerCase()]: "USDC",
  [ETHEREUM_TOKEN_ADDRESSES.USDT.toLowerCase()]: "USDT",
} as const;

// Helper to convert Fluid's factor format to percentage
// Fluid uses 1e4 for percentages (10000 = 100%)
const toPercentage = (value: bigint | number) => (Number(value) / 1e4) * 100;

// Helper to convert Fluid's rate format to APR percentage
// Fluid rates are per second, scaled by 1e18
const rateToApr = (ratePerSecond: bigint) => {
  const secondsPerYear = 60 * 60 * 24 * 365;
  return (Number(ratePerSecond) / 1e18) * secondsPerYear * 100;
};

interface FluidData {
  collateralRaw: bigint;
  borrowRaw: bigint;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
  nftId?: bigint;
  borrowToken: string; // Dynamic borrow token (USDC or USDT)
}

type Asset = {
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
};

type UseFluidResult = {
  collateralRaw: bigint;
  borrowRaw: bigint;
  suppliedAssets: Asset[];
  borrowedAssets: Asset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
  netLoanValue: number;
  hasPosition: boolean;
  nftId?: bigint;
};

// Query key factory for Fluid data
export const fluidKeys = {
  all: ["fluid"] as const,
  byAccount: (account: string) => [...fluidKeys.all, account] as const,
};

// Fetcher function for Fluid data
async function fetchFluidData(
  publicClient: PublicClient,
  account: string
): Promise<FluidData> {
  const userAddress = account as Address;

  try {
    const { positions, vaultsData } = await getUserPositions(
      publicClient,
      userAddress
    );

    // Find XAUT collateral position
    // Match by checking if the supply token is XAUT and borrow token is USDC or USDT
    const xautAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT.toLowerCase();

    let matchingPosition: FluidUserPosition | undefined;
    let matchingVaultData: FluidVaultData | undefined;
    let matchedBorrowToken: string | undefined;

    for (let i = 0; i < positions.length; i++) {
      const vaultData = vaultsData[i];
      const borrowTokenAddress = vaultData.borrowToken.toLowerCase();
      const borrowTokenSymbol = SUPPORTED_BORROW_TOKENS[borrowTokenAddress];

      // Check if this vault uses XAUT as collateral and a supported borrow token (USDC or USDT)
      if (
        vaultData.supplyToken.toLowerCase() === xautAddress &&
        borrowTokenSymbol
      ) {
        matchingPosition = positions[i];
        matchingVaultData = vaultData;
        matchedBorrowToken = borrowTokenSymbol;
        break;
      }
    }

    // If no XAUT position with supported borrow token found, return zeros
    if (!matchingPosition || !matchingVaultData || !matchedBorrowToken) {
      console.log("[FLUID] No XAUT position with USDC/USDT found for account:", account);
      return {
        collateralRaw: BigInt(0),
        borrowRaw: BigInt(0),
        maxLtv: 0,
        liquidationRatio: 0,
        borrowApr: 0,
        nftId: undefined,
        borrowToken: "USDT", // Default, won't be used since no position
      };
    }

    const result: FluidData = {
      collateralRaw: matchingPosition.supply,
      borrowRaw: matchingPosition.borrow,
      maxLtv: toPercentage(matchingVaultData.collateralFactor),
      liquidationRatio: toPercentage(matchingVaultData.liquidationThreshold),
      borrowApr: rateToApr(matchingVaultData.borrowRate),
      nftId: matchingPosition.nftId,
      borrowToken: matchedBorrowToken,
    };

    // Debug logging
    console.log("[FLUID] Account:", account);
    console.log("[FLUID] NFT ID:", matchingPosition.nftId.toString());
    console.log("[FLUID] Collateral Raw:", matchingPosition.supply.toString());
    console.log("[FLUID] Borrow Raw:", matchingPosition.borrow.toString());
    console.log("[FLUID] Max LTV:", result.maxLtv, "%");
    console.log("[FLUID] Liquidation Ratio:", result.liquidationRatio, "%");
    console.log("[FLUID] Borrow APR:", result.borrowApr, "%");

    return result;
  } catch (error) {
    console.error("[FLUID] Error fetching positions:", error);
    // Return zeros on error
    return {
      collateralRaw: BigInt(0),
      borrowRaw: BigInt(0),
      maxLtv: 0,
      liquidationRatio: 0,
      borrowApr: 0,
      nftId: undefined,
      borrowToken: "USDT", // Default, won't be used since error
    };
  }
}

export function useFluid(): UseFluidResult {
  const { ethereumPublicClient, walletClient, activeWalletAddress } = useWeb3();
  const getTokenPrice = useGetTokenPrice();
  const acct = walletClient?.account?.address || activeWalletAddress;

  // Use TanStack Query for data fetching with caching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: fluidKeys.byAccount(acct || ""),
    queryFn: () => fetchFluidData(ethereumPublicClient!, acct!),
    enabled: !!ethereumPublicClient && !!acct,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });

  const collateralRaw = data?.collateralRaw ?? BigInt(0);
  const borrowRaw = data?.borrowRaw ?? BigInt(0);
  const maxLtv = data?.maxLtv ?? 0;
  const liquidationRatio = data?.liquidationRatio ?? 0;
  const borrowApr = data?.borrowApr ?? 0;
  const nftId = data?.nftId;
  const borrowToken = data?.borrowToken ?? "USDT";

  const collateralAmount = Number(
    formatUnits(collateralRaw, getTokenMetadata(COLLATERAL_TOKEN).decimals)
  );

  const borrowAmount = Number(
    formatUnits(borrowRaw, getTokenMetadata(borrowToken).decimals)
  );

  const xautPrice = getTokenPrice(COLLATERAL_TOKEN);
  const borrowTokenPrice = getTokenPrice(borrowToken);
  const collateralUsd = collateralAmount * xautPrice;
  const borrowUsd = borrowAmount * borrowTokenPrice;
  const netLoanValue = collateralUsd - borrowUsd;

  // Determine if user has an active position
  const hasPosition = collateralRaw > BigInt(0) || borrowRaw > BigInt(0);

  // Debug logging for USD calculations
  console.log("[FLUID] XAUT Price:", xautPrice);
  console.log(`[FLUID] ${borrowToken} Price:`, borrowTokenPrice);
  console.log("[FLUID] Collateral Amount:", collateralAmount, "XAUT");
  console.log("[FLUID] Collateral USD:", collateralUsd);
  console.log(`[FLUID] Borrow Amount:`, borrowAmount, borrowToken);
  console.log("[FLUID] Borrow USD:", borrowUsd);
  console.log("[FLUID] Net Loan Value:", netLoanValue);

  const suppliedAssets: Asset[] = useMemo(
    () => [
      {
        symbol: COLLATERAL_TOKEN,
        amount: collateralAmount,
        usdValue: collateralUsd,
        decimals: getTokenMetadata(COLLATERAL_TOKEN)?.decimals,
      },
    ],
    [collateralAmount, collateralUsd]
  );

  const borrowedAssets: Asset[] = useMemo(
    () => [
      {
        symbol: borrowToken,
        amount: borrowAmount,
        usdValue: borrowUsd,
        decimals: getTokenMetadata(borrowToken)?.decimals,
      },
    ],
    [borrowToken, borrowAmount, borrowUsd]
  );

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    collateralRaw,
    borrowRaw,
    suppliedAssets,
    borrowedAssets,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    refetch: handleRefetch,
    maxLtv,
    liquidationRatio,
    borrowApr,
    netLoanValue,
    hasPosition,
    nftId,
  };
}

// Prefetch function for use in other components
export function prefetchFluidData(
  queryClient: QueryClient,
  publicClient: PublicClient,
  account: string
) {
  return queryClient.prefetchQuery({
    queryKey: fluidKeys.byAccount(account),
    queryFn: () => fetchFluidData(publicClient, account),
    staleTime: 30_000,
  });
}
