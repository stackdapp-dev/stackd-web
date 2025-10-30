import { TOKEN_METADATA, getTokenMetadata } from "@/constants/Tokens";
import { C_COMPOUND_ADDR } from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import { borrowBalanceOf, allowance as compoundAllowance, approve as compoundApprove, supply as compoundSupply, withdraw as compoundWithdraw, getAssetInfo, getBorrowRate, getUtilization, userCollateral } from "@/lib/web3/compound";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useWeb3 } from "@/providers/Web3Provider";
import { useCallback, useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import { formatUnits } from "viem";

// Token symbols used for collateral and borrowing
const COLLATERAL_TOKEN = "WBTC";
const BORROW_TOKEN = "USDT";

// Helper function to convert from wei (10^18) to percentage
const toPercentage = (value: bigint | number) => (Number(value) / 1e18) * 100;

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
  approve: (token: Address, amount: bigint, spender?: Address) => Promise<{ txHash: Hex | null; error: string | null }>;
  supply: (token: Address, amount: bigint) => Promise<{ txHash: Hex | null; error: string | null }>;
  withdraw: (token: Address, amount: bigint) => Promise<{ txHash: Hex | null; error: string | null }>;
  allowance?: (token: Address, spender?: Address) => Promise<bigint | null>;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
  netLoanValue: number;
};

export function useCompound(accountAddress?: `0x${string}`): UseCompoundResult {
  const { publicClient, walletClient } = useWeb3();
  const getTokenPrice = useGetTokenPrice();
  const acct = walletClient?.account?.address || accountAddress;

  const [collateralRaw, setCollateralRaw] = useState<bigint>(BigInt(0));
  const [borrowRaw, setBorrowRaw] = useState<bigint>(BigInt(0));
  const [maxLtv, setMaxLtv] = useState<number>(0);
  const [liquidationRatio, setLiquidationRatio] = useState<number>(0);
  const [borrowApr, setBorrowApr] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const fetch = useCallback(async () => {
    if (!publicClient || !acct) return;
    try {
      if (initialLoad) setIsLoading(true);
      const coll = await userCollateral(publicClient, formatAddress(acct), formatAddress(TOKEN_METADATA.WBTC.address));
      const bor = await borrowBalanceOf(publicClient, formatAddress(acct));
      const assetInfo = await getAssetInfo(publicClient, formatAddress(TOKEN_METADATA.WBTC.address));

      // Get utilization and borrow rate for APR calculation
      const utilization = await getUtilization(publicClient);
      const borrowRate = await getBorrowRate(publicClient, utilization);

      // Calculate APR: (borrowRate / 10^18) * secondsPerYear * 100
      const secondsPerYear = 60 * 60 * 24 * 365; // 31536000
      const apr = (Number(borrowRate) / 10 ** 18) * secondsPerYear * 100;
      setBorrowApr(apr);

      setCollateralRaw(coll ?? BigInt(0));
      setBorrowRaw(bor ?? BigInt(0));
      setMaxLtv(toPercentage(assetInfo.borrowCollateralFactor));
      setLiquidationRatio(toPercentage(assetInfo.liquidateCollateralFactor));
      setError(null);
      setIsLoading(false);
      setInitialLoad(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
      setInitialLoad(false);
    }
  }, [publicClient, acct, initialLoad]);

  useEffect(() => {
    setIsLoading(true);
    void fetch();
  }, [fetch]);

  const collateralAmount = Number(formatUnits(collateralRaw, getTokenMetadata(COLLATERAL_TOKEN).decimals));

  const borrowAmount = Number(formatUnits(borrowRaw, getTokenMetadata(BORROW_TOKEN).decimals));

  const collateralUsd = collateralAmount * getTokenPrice(COLLATERAL_TOKEN);
  const borrowUsd = borrowAmount * getTokenPrice(BORROW_TOKEN);
  const netLoanValue = collateralUsd - borrowUsd;

  const suppliedAssets: Asset[] = [
    {
      symbol: COLLATERAL_TOKEN,
      amount: collateralAmount,
      usdValue: collateralUsd,
      decimals: getTokenMetadata(COLLATERAL_TOKEN)?.decimals,
    },
  ];

  const borrowedAssets: Asset[] = [
    {
      symbol: BORROW_TOKEN,
      amount: borrowAmount,
      usdValue: borrowUsd,
      decimals: getTokenMetadata(BORROW_TOKEN)?.decimals,
    },
  ];

  const approve = useCallback(
    async (token: Address, amount: bigint, spender: Address = C_COMPOUND_ADDR): Promise<{ txHash: Hex | null; error: string | null }> => {
      if (!walletClient || !acct) {
        return { txHash: null, error: "walletClient or account not available" };
      }

      try {
        const tx = await compoundApprove(walletClient, formatAddress(acct), token, spender, amount);
        return { txHash: tx, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown approval error";
        console.error("approve failed", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [walletClient, acct]
  );

  const allowance = useCallback(
    async (token: Address, spender: Address = C_COMPOUND_ADDR): Promise<bigint | null> => {
      if (!publicClient || !acct) return null;
      try {
        const res = await compoundAllowance(publicClient, formatAddress(acct), token, spender);
        return res ?? null;
      } catch (err) {
        console.error("allowance read failed", err);
        return null;
      }
    },
    [publicClient, acct]
  );

  const supply = useCallback(
    async (token: Address, amount: bigint): Promise<{ txHash: Hex | null; error: string | null }> => {
      if (!walletClient || !acct) {
        return { txHash: null, error: "walletClient or account not available" };
      }

      try {
        const tx = await compoundSupply(walletClient, formatAddress(acct), token, amount);
        return { txHash: tx, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown supply error";
        console.error("supply failed", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [walletClient, acct]
  );

  const withdraw = useCallback(
    async (token: Address, amount: bigint): Promise<{ txHash: Hex | null; error: string | null }> => {
      if (!walletClient || !acct) {
        return { txHash: null, error: "walletClient or account not available" };
      }

      try {
        const tx = await compoundWithdraw(walletClient, formatAddress(acct), token, amount);
        return { txHash: tx, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown withdraw error";
        console.error("withdraw failed", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [walletClient, acct]
  );

  return {
    collateralRaw,
    borrowRaw,
    suppliedAssets,
    borrowedAssets,
    isLoading,
    error,
    refetch: fetch,
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
