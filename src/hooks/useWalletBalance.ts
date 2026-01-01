import { TOKEN_METADATA, getTokenMetadata } from "@/constants/Tokens";
import { TOKEN_ADDRESSES } from "@/constants/addresses";
import { formatAddress } from "@/lib/utils";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { erc20Abi, formatEther, formatUnits, PublicClient, Address } from "viem";

interface TokenBalance {
  symbol: string;
  balance: number;
  decimals: number;
}

interface Asset {
  symbol: string;
  name: string;
  amount: number;
  usdValue: number;
  icon?: string;
}

interface WalletBalance {
  ethBalance: number;
  tokenBalances: Record<string, TokenBalance>;
  assets: Asset[];
  totalBalance: number;
  isLoading: boolean;
  error: string | null;
  refetchBalances: () => Promise<void>;
}

interface RawBalanceData {
  ethBalance: number;
  tokenBalances: Record<string, TokenBalance>;
}

// Query key factory for wallet balance
export const walletBalanceKeys = {
  all: ['walletBalance'] as const,
  byAddress: (address: string) => [...walletBalanceKeys.all, address] as const,
};

// Fetcher function for wallet balances
async function fetchWalletBalances(
  publicClient: PublicClient,
  walletAddress: Address,
  tokenEntries: [string, Address][]
): Promise<RawBalanceData> {
  const [balanceWei, balanceResults] = await Promise.all([
    publicClient.getBalance({ address: walletAddress }),
    publicClient.multicall({
      contracts: tokenEntries.map(([, tokenAddress]) => ({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: [walletAddress],
      })),
    }),
  ]);

  const ethBalance = Number(formatEther(balanceWei));

  // Process token balance results
  const tokenBalances: Record<string, TokenBalance> = {};
  tokenEntries.forEach(([symbol], index) => {
    const balanceResult = balanceResults[index];
    const metadata = getTokenMetadata(symbol);
    if (balanceResult.status === "success" && metadata) {
      const balance = balanceResult.result as bigint;
      const formattedBalance = Number(
        formatUnits(balance, metadata.decimals)
      );

      tokenBalances[symbol] = {
        symbol,
        balance: formattedBalance,
        decimals: metadata.decimals,
      };
    } else if (metadata) {
      tokenBalances[symbol] = {
        symbol,
        balance: 0,
        decimals: metadata.decimals,
      };
    }
  });

  return { ethBalance, tokenBalances };
}

export function useWalletBalance(tokenPrices: Record<string, { usd: number }> = {}): WalletBalance {
  const { publicClient, walletClient, isExternalWallet } = useWeb3();

  const walletAddress = walletClient?.account?.address
    ? formatAddress(walletClient.account.address) as Address
    : undefined;

  const tokenEntries = useMemo(
    () => Object.entries(TOKEN_ADDRESSES) as [string, Address][],
    []
  );

  // Use TanStack Query for data fetching with caching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: walletBalanceKeys.byAddress(walletAddress || ''),
    queryFn: () => fetchWalletBalances(publicClient!, walletAddress!, tokenEntries),
    enabled: !!publicClient && !!walletAddress,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });

  const ethBalance = data?.ethBalance ?? 0;
  const tokenBalances = data?.tokenBalances ?? {};

  const assets: Asset[] = useMemo(() => {
    return Object.entries(TOKEN_METADATA)
      // Only show ETH for external wallets (they need it for gas)
      .filter(([key]) => key !== "ETH" || isExternalWallet)
      .map(([key, meta]) => {
        const amount = key === "ETH" ? ethBalance : tokenBalances[key]?.balance ?? 0;
        const usdValue = amount * (tokenPrices[key]?.usd ?? 0);
        return {
          symbol: meta.symbol,
          name: meta.name,
          amount,
          usdValue,
          icon: meta.icon,
        };
      });
  }, [ethBalance, tokenBalances, tokenPrices, isExternalWallet]);

  const totalBalance = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.usdValue, 0);
  }, [assets]);

  const refetchBalances = async () => {
    await refetch();
  };

  return {
    ethBalance,
    tokenBalances,
    assets,
    totalBalance,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to fetch balances") : null,
    refetchBalances,
  };
}

// Prefetch function for use in other components
export function prefetchWalletBalance(
  queryClient: QueryClient,
  publicClient: PublicClient,
  walletAddress: Address,
  tokenEntries: [string, Address][]
) {
  return queryClient.prefetchQuery({
    queryKey: walletBalanceKeys.byAddress(walletAddress),
    queryFn: () => fetchWalletBalances(publicClient, walletAddress, tokenEntries),
    staleTime: 30_000,
  });
}
