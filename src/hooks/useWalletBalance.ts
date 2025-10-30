import { TOKEN_ADDRESSES, TOKEN_METADATA, getTokenMetadata } from "@/constants/Tokens";
import { formatAddress } from "@/lib/utils";
import { useWeb3 } from "@/providers/Web3Provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { erc20Abi, formatEther, formatUnits } from "viem";

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

export function useWalletBalance(tokenPrices: Record<string, { usd: number }> = {}): WalletBalance {
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { publicClient, walletClient } = useWeb3();

  const tokenEntries = useMemo(() => Object.entries(TOKEN_ADDRESSES), []);

  const assets: Asset[] = useMemo(() => {
    return Object.entries(TOKEN_METADATA).map(([key, meta]) => {
      const amount = key === "ETH" ? ethBalance : tokenBalances[key]?.balance;
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

  const fetchBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!walletClient?.account?.address) {
        setEthBalance(0);
        setTokenBalances({});
        setIsLoading(false);
        return;
      }

      const walletAddress = formatAddress(walletClient.account.address);

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

      const ethBalanceNumber = Number(formatEther(balanceWei));
      setEthBalance(ethBalanceNumber);

      // Process token balance results
      const balances: Record<string, TokenBalance> = {};
      tokenEntries.forEach(([symbol], index) => {
        const balanceResult = balanceResults[index];
        const metadata = getTokenMetadata(symbol);
        if (balanceResult.status === "success" && metadata) {
          const balance = balanceResult.result as bigint;
          const formattedBalance = Number(formatUnits(balance, metadata.decimals));

          balances[symbol] = {
            symbol,
            balance: formattedBalance,
            decimals: metadata.decimals,
          };
        } else {
          balances[symbol] = {
            symbol,
            balance: 0,
            decimals: metadata.decimals,
          };
        }
      });

      setTokenBalances(balances);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
      setEthBalance(0);
      setTokenBalances({});
      setIsLoading(false);
    }
  }, [walletClient?.account?.address, publicClient, tokenEntries]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    ethBalance,
    tokenBalances,
    assets,
    totalBalance,
    isLoading,
    error,
    refetchBalances: fetchBalances,
  };
}
