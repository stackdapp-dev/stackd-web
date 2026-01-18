import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
import { getTokenMetadata } from "@/constants/Tokens";
import { formatAddress } from "@/lib/utils";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { erc20Abi, formatUnits, PublicClient, Address } from "viem";

interface XautBalanceResult {
    /** XAUT balance in the user's Ethereum wallet (not in collateral) */
    xautBalance: number;
    /** Loading state */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;
    /** Refetch function */
    refetch: () => Promise<void>;
}

// Query key factory for XAUT balance
export const xautBalanceKeys = {
    all: ["xautBalance"] as const,
    byAddress: (address: string) => [...xautBalanceKeys.all, address] as const,
};

// Fetcher function for XAUT balance from Ethereum mainnet
async function fetchXautBalance(
    ethereumPublicClient: PublicClient,
    walletAddress: Address
): Promise<number> {
    const xautAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT;
    const xautMetadata = getTokenMetadata("XAUT");

    if (!xautMetadata) {
        console.error("[XAUT BALANCE] No metadata found for XAUT token");
        return 0;
    }

    try {
        const balance = await ethereumPublicClient.readContract({
            address: xautAddress,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [walletAddress],
        });

        const formattedBalance = Number(
            formatUnits(balance as bigint, xautMetadata.decimals)
        );

        console.log("[XAUT BALANCE] Wallet address:", walletAddress);
        console.log("[XAUT BALANCE] Raw balance:", (balance as bigint).toString());
        console.log("[XAUT BALANCE] Formatted balance:", formattedBalance);

        return formattedBalance;
    } catch (error) {
        console.error("[XAUT BALANCE] Error fetching XAUT balance:", error);
        return 0;
    }
}

/**
 * Hook to fetch XAUT balance from Ethereum mainnet.
 * 
 * XAUT is on Ethereum mainnet, while most other tokens (WBTC, USDT) are on Arbitrum.
 * This hook uses the Ethereum public client to fetch the idle XAUT balance
 * that is NOT deposited as collateral in Fluid protocol.
 */
export function useXautBalance(): XautBalanceResult {
    const { ethereumPublicClient, walletClient, activeWalletAddress } = useWeb3();

    const walletAddress = walletClient?.account?.address
        ? (formatAddress(walletClient.account.address) as Address)
        : activeWalletAddress
            ? (formatAddress(activeWalletAddress) as Address)
            : undefined;

    // Use TanStack Query for data fetching with caching
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: xautBalanceKeys.byAddress(walletAddress || ""),
        queryFn: () => fetchXautBalance(ethereumPublicClient!, walletAddress!),
        enabled: !!ethereumPublicClient && !!walletAddress,
        staleTime: 30_000, // 30 seconds
        gcTime: 5 * 60_000, // 5 minutes
    });

    const handleRefetch = async () => {
        await refetch();
    };

    return {
        xautBalance: data ?? 0,
        isLoading,
        error: error
            ? error instanceof Error
                ? error.message
                : "Failed to fetch XAUT balance"
            : null,
        refetch: handleRefetch,
    };
}

// Prefetch function for use in other components
export function prefetchXautBalance(
    queryClient: QueryClient,
    ethereumPublicClient: PublicClient,
    walletAddress: Address
) {
    return queryClient.prefetchQuery({
        queryKey: xautBalanceKeys.byAddress(walletAddress),
        queryFn: () => fetchXautBalance(ethereumPublicClient, walletAddress),
        staleTime: 30_000,
    });
}
