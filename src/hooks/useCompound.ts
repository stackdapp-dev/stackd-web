import { TOKEN_METADATA, getTokenMetadata } from "@/constants/Tokens";
import { C_COMPOUND_ADDR } from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import {
  borrowBalanceOf,
  getAssetInfo,
  getBorrowRate,
  getUtilization,
  userCollateral,
  encodeSupplyData,
  encodeWithdrawData,
  encodeApproveData,
} from "@/lib/web3/compound";
import {
  allowance as compoundAllowance,
} from "@/lib/web3/erc20";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { Address, Hex, PublicClient } from "viem";
import { formatUnits } from "viem";

// Token symbols used for collateral and borrowing
const COLLATERAL_TOKEN = "WBTC";
const BORROW_TOKEN = "USDT";

// Helper function to convert from wei (10^18) to percentage
const toPercentage = (value: bigint | number) => (Number(value) / 1e18) * 100;

interface CompoundData {
  collateralRaw: bigint;
  borrowRaw: bigint;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
}

type Asset = {
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
};

type UseCompoundResult = {
  collateralRaw: bigint;
  borrowRaw: bigint;
  suppliedAssets: Asset[];
  borrowedAssets: Asset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  approve: (
    token: Address,
    amount: bigint,
    spender?: Address
  ) => Promise<{ txHash: Hex | null; error: string | null }>;
  supply: (
    token: Address,
    amount: bigint
  ) => Promise<{ txHash: Hex | null; error: string | null }>;
  withdraw: (
    token: Address,
    amount: bigint
  ) => Promise<{ txHash: Hex | null; error: string | null }>;
  allowance?: (token: Address, spender?: Address) => Promise<bigint | null>;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
  netLoanValue: number;
};

// Query key factory for compound data
export const compoundKeys = {
  all: ['compound'] as const,
  byAccount: (account: string) => [...compoundKeys.all, account] as const,
};

// Fetcher function for Compound data
async function fetchCompoundData(
  publicClient: PublicClient,
  account: string
): Promise<CompoundData> {
  const formattedAccount = formatAddress(account);
  const wbtcAddress = formatAddress(TOKEN_METADATA.WBTC.address);

  const [coll, bor, assetInfo, utilization] = await Promise.all([
    userCollateral(publicClient, formattedAccount, wbtcAddress),
    borrowBalanceOf(publicClient, formattedAccount),
    getAssetInfo(publicClient, wbtcAddress),
    getUtilization(publicClient),
  ]);

  const borrowRate = await getBorrowRate(publicClient, utilization);

  // Calculate APR: (borrowRate / 10^18) * secondsPerYear * 100
  const secondsPerYear = 60 * 60 * 24 * 365;
  const apr = (Number(borrowRate) / 10 ** 18) * secondsPerYear * 100;

  const result = {
    collateralRaw: coll ?? BigInt(0),
    borrowRaw: bor ?? BigInt(0),
    maxLtv: toPercentage(assetInfo.borrowCollateralFactor),
    liquidationRatio: toPercentage(assetInfo.liquidateCollateralFactor),
    borrowApr: apr,
  };

  // Debug logging
  console.log("[COMPOUND] Account:", account);
  console.log("[COMPOUND] WBTC Address:", TOKEN_METADATA.WBTC.address);
  console.log("[COMPOUND] Collateral Raw:", coll?.toString());
  console.log("[COMPOUND] Borrow Raw:", bor?.toString());
  console.log("[COMPOUND] Max LTV:", result.maxLtv, "%");
  console.log("[COMPOUND] Liquidation Ratio:", result.liquidationRatio, "%");

  return result;
}

export function useCompound(): UseCompoundResult {
  const { publicClient, walletClient, activeWalletAddress, ensureCorrectNetwork, sendSponsoredTransaction } = useWeb3();
  const getTokenPrice = useGetTokenPrice();
  const acct = walletClient?.account?.address || activeWalletAddress;

  // Use TanStack Query for data fetching with caching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: compoundKeys.byAccount(acct || ''),
    queryFn: () => fetchCompoundData(publicClient!, acct!),
    enabled: !!publicClient && !!acct,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });

  const collateralRaw = data?.collateralRaw ?? BigInt(0);
  const borrowRaw = data?.borrowRaw ?? BigInt(0);
  const maxLtv = data?.maxLtv ?? 0;
  const liquidationRatio = data?.liquidationRatio ?? 0;
  const borrowApr = data?.borrowApr ?? 0;

  const collateralAmount = Number(
    formatUnits(collateralRaw, getTokenMetadata(COLLATERAL_TOKEN).decimals)
  );

  const borrowAmount = Number(
    formatUnits(borrowRaw, getTokenMetadata(BORROW_TOKEN).decimals)
  );

  const wbtcPrice = getTokenPrice(COLLATERAL_TOKEN);
  const usdtPrice = getTokenPrice(BORROW_TOKEN);
  const collateralUsd = collateralAmount * wbtcPrice;
  const borrowUsd = borrowAmount * usdtPrice;
  const netLoanValue = collateralUsd - borrowUsd;

  // Debug logging for USD calculations
  console.log("[COMPOUND] WBTC Price:", wbtcPrice);
  console.log("[COMPOUND] USDT Price:", usdtPrice);
  console.log("[COMPOUND] Collateral Amount:", collateralAmount, "WBTC");
  console.log("[COMPOUND] Collateral USD:", collateralUsd);
  console.log("[COMPOUND] Max LTV:", maxLtv, "%");
  console.log("[COMPOUND] Borrowable:", collateralUsd * (maxLtv / 100) - borrowUsd);

  const suppliedAssets: Asset[] = useMemo(() => [
    {
      symbol: COLLATERAL_TOKEN,
      amount: collateralAmount,
      usdValue: collateralUsd,
      decimals: getTokenMetadata(COLLATERAL_TOKEN)?.decimals,
    },
  ], [collateralAmount, collateralUsd]);

  const borrowedAssets: Asset[] = useMemo(() => [
    {
      symbol: BORROW_TOKEN,
      amount: borrowAmount,
      usdValue: borrowUsd,
      decimals: getTokenMetadata(BORROW_TOKEN)?.decimals,
    },
  ], [borrowAmount, borrowUsd]);

  const approve = useCallback(
    async (
      token: Address,
      amount: bigint,
      spender: Address = C_COMPOUND_ADDR
    ): Promise<{ txHash: Hex | null; error: string | null }> => {
      if (!acct) {
        return { txHash: null, error: "Account not available" };
      }

      try {
        await ensureCorrectNetwork();

        // Use sponsored transaction for gas-free approval
        const data = encodeApproveData(spender, amount);
        const result = await sendSponsoredTransaction({
          to: token,
          data,
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown approval error";
        console.error("approve failed", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [acct, ensureCorrectNetwork, sendSponsoredTransaction]
  );

  const allowance = useCallback(
    async (
      token: Address,
      spender: Address = C_COMPOUND_ADDR
    ): Promise<bigint | null> => {
      if (!publicClient || !acct) return null;
      try {
        const res = await compoundAllowance(
          publicClient,
          formatAddress(acct),
          token,
          spender
        );
        return res ?? null;
      } catch (err) {
        console.error("allowance read failed", err);
        return null;
      }
    },
    [publicClient, acct]
  );

  const supply = useCallback(
    async (
      token: Address,
      amount: bigint
    ): Promise<{ txHash: Hex | null; error: string | null }> => {
      if (!acct) {
        return { txHash: null, error: "Account not available" };
      }

      try {
        await ensureCorrectNetwork();

        // Use sponsored transaction for gas-free supply
        const data = encodeSupplyData(token, amount);
        const result = await sendSponsoredTransaction({
          to: C_COMPOUND_ADDR as `0x${string}`,
          data,
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown supply error";
        console.error("supply failed", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [acct, ensureCorrectNetwork, sendSponsoredTransaction]
  );

  const withdraw = useCallback(
    async (
      token: Address,
      amount: bigint
    ): Promise<{ txHash: Hex | null; error: string | null }> => {
      if (!acct) {
        return { txHash: null, error: "Account not available" };
      }

      try {
        await ensureCorrectNetwork();

        // Use sponsored transaction for gas-free withdraw
        const data = encodeWithdrawData(token, amount);
        const result = await sendSponsoredTransaction({
          to: C_COMPOUND_ADDR as `0x${string}`,
          data,
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown withdraw error";
        console.error("withdraw failed", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [acct, ensureCorrectNetwork, sendSponsoredTransaction]
  );

  const handleRefetch = async () => {
    await refetch();
  };

  return {
    collateralRaw,
    borrowRaw,
    suppliedAssets,
    borrowedAssets,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: handleRefetch,
    approve,
    supply,
    withdraw,
    allowance,
    maxLtv,
    liquidationRatio,
    borrowApr,
    netLoanValue,
  };
}

// Prefetch function for use in other components
export function prefetchCompoundData(
  queryClient: QueryClient,
  publicClient: PublicClient,
  account: string
) {
  return queryClient.prefetchQuery({
    queryKey: compoundKeys.byAccount(account),
    queryFn: () => fetchCompoundData(publicClient, account),
    staleTime: 30_000,
  });
}
