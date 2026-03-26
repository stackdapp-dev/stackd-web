import { TOKEN_METADATA, getTokenMetadata } from "@/constants/Tokens";
import { TOKEN_ADDRESSES, ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
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

interface ChainBalances {
  arbitrum: Record<string, number>;
  ethereum: Record<string, number>;
}

interface WalletBalance {
  ethBalance: number;
  tokenBalances: Record<string, TokenBalance>;
  chainBalances: ChainBalances;
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
  const { publicClient, ethereumPublicClient, walletClient } = useWeb3();

  const walletAddress = walletClient?.account?.address
    ? formatAddress(walletClient.account.address) as Address
    : undefined;

  const arbitrumTokenEntries = useMemo(
    () => Object.entries(TOKEN_ADDRESSES) as [string, Address][],
    []
  );

  const ethereumTokenEntries = useMemo(
    () => Object.entries(ETHEREUM_TOKEN_ADDRESSES).filter(([symbol]) => symbol === "XAUT" || symbol === "USDT") as [string, Address][],
    []
  );

  // Use TanStack Query for Arbitrum token balances
  const { data: arbitrumData, isLoading: arbitrumLoading, error: arbitrumError, refetch: refetchArbitrum } = useQuery({
    queryKey: [...walletBalanceKeys.byAddress(walletAddress || ''), 'arbitrum'],
    queryFn: () => fetchWalletBalances(publicClient!, walletAddress!, arbitrumTokenEntries),
    enabled: !!publicClient && !!walletAddress,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });

  // Use TanStack Query for Ethereum token balances (XAUT)
  const { data: ethereumData, isLoading: ethereumLoading, error: ethereumError, refetch: refetchEthereum } = useQuery({
    queryKey: [...walletBalanceKeys.byAddress(walletAddress || ''), 'ethereum'],
    queryFn: () => fetchWalletBalances(ethereumPublicClient!, walletAddress!, ethereumTokenEntries),
    enabled: !!ethereumPublicClient && !!walletAddress,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });

  // Use Ethereum mainnet ETH balance (needed for Fluid/XAUT gas on Ethereum)
  const ethBalance = ethereumData?.ethBalance ?? 0;

  // Track chain-specific balances for multi-chain tokens (including native ETH)
  const chainBalances = useMemo((): ChainBalances => {
    const arbitrum: Record<string, number> = {};
    const ethereum: Record<string, number> = {};

    // Arbitrum balances
    if (arbitrumData?.tokenBalances) {
      Object.entries(arbitrumData.tokenBalances).forEach(([symbol, data]) => {
        arbitrum[symbol] = data.balance;
      });
    }
    if (arbitrumData?.ethBalance !== undefined) {
      arbitrum.ETH = arbitrumData.ethBalance;
    }

    // Ethereum balances
    if (ethereumData?.tokenBalances) {
      Object.entries(ethereumData.tokenBalances).forEach(([symbol, data]) => {
        ethereum[symbol] = data.balance;
      });
    }
    if (ethereumData?.ethBalance !== undefined) {
      ethereum.ETH = ethereumData.ethBalance;
    }

    return { arbitrum, ethereum };
  }, [arbitrumData?.tokenBalances, arbitrumData?.ethBalance, ethereumData?.tokenBalances, ethereumData?.ethBalance]);

  // Merge token balances from both chains (for tokens that exist on both, sum them)
  const tokenBalances = useMemo(() => {
    const merged: Record<string, TokenBalance> = {};

    // Add Arbitrum balances
    if (arbitrumData?.tokenBalances) {
      Object.entries(arbitrumData.tokenBalances).forEach(([symbol, data]) => {
        merged[symbol] = { ...data };
      });
    }

    // Add/merge Ethereum balances
    if (ethereumData?.tokenBalances) {
      Object.entries(ethereumData.tokenBalances).forEach(([symbol, data]) => {
        if (merged[symbol]) {
          // Token exists on both chains - sum the balances
          merged[symbol] = {
            ...merged[symbol],
            balance: merged[symbol].balance + data.balance,
          };
        } else {
          merged[symbol] = { ...data };
        }
      });
    }

    return merged;
  }, [arbitrumData?.tokenBalances, ethereumData?.tokenBalances]);

  const isLoading = arbitrumLoading || ethereumLoading;
  const error = arbitrumError || ethereumError;

  const assets: Asset[] = useMemo(() => {
    return Object.entries(TOKEN_METADATA)
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
  }, [ethBalance, tokenBalances, tokenPrices]);

  const totalBalance = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.usdValue, 0);
  }, [assets]);

  const refetchBalances = async () => {
    await Promise.all([refetchArbitrum(), refetchEthereum()]);
  };

  return {
    ethBalance,
    tokenBalances,
    chainBalances,
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
