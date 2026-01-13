"use client";

import { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQuery, QueryClient } from "@tanstack/react-query";

export interface Transaction {
    hash: string;
    type: "send" | "receive";
    from: string;
    to: string;
    value: string;
    symbol: string;
    decimals: number;
    tokenName?: string;
    contractAddress?: string;
    timestamp: number;
    blockNumber: string;
    isError?: boolean;
    gasUsed?: string;
    gasPrice?: string;
}

interface UseTransactionHistoryResult {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    totalCount: number;
    visibleCount: number;
    loadMore: () => void;
    refresh: () => Promise<void>;
}

interface TransactionApiResponse {
    status: string;
    result: Transaction[];
}

const PAGE_SIZE = 7; // Initial visible transactions
const LOAD_MORE_SIZE = 10; // Load 10 more at a time

// Query key factory for transaction history
export const transactionHistoryKeys = {
    all: ['transactionHistory'] as const,
    byAddress: (address: string) => [...transactionHistoryKeys.all, address] as const,
};

// Fetcher function for transactions
async function fetchTransactions(address: string): Promise<Transaction[]> {
    const params = new URLSearchParams({
        address,
        page: "1",
        offset: "50", // Fetch more to have data for "see more"
    });

    const response = await fetch(`/api/transactions?${params}`);

    if (!response.ok) {
        throw new Error("Failed to fetch transactions");
    }

    const data: TransactionApiResponse = await response.json();

    if (data.status === "1") {
        return data.result;
    }

    return [];
}

export function useTransactionHistory(): UseTransactionHistoryResult {
    const { activeWalletAddress } = useWeb3();
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Use TanStack Query for data fetching with caching
    const { data: transactions = [], isLoading, error, refetch } = useQuery({
        queryKey: transactionHistoryKeys.byAddress(activeWalletAddress || ''),
        queryFn: () => fetchTransactions(activeWalletAddress!),
        enabled: !!activeWalletAddress,
        staleTime: 30_000, // 30 seconds
        gcTime: 5 * 60_000, // 5 minutes
    });

    // Load more transactions
    const loadMore = useCallback(() => {
        setVisibleCount((prev) => Math.min(prev + LOAD_MORE_SIZE, transactions.length));
    }, [transactions.length]);

    // Reset visible count when address changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [activeWalletAddress]);

    const refresh = async () => {
        await refetch();
    };

    return {
        transactions: transactions.slice(0, visibleCount),
        isLoading,
        error: error ? (error instanceof Error ? error.message : "Failed to load transactions") : null,
        hasMore: visibleCount < transactions.length,
        totalCount: transactions.length,
        visibleCount: Math.min(visibleCount, transactions.length),
        loadMore,
        refresh,
    };
}

// Prefetch function for use in other components
export function prefetchTransactionHistory(
    queryClient: QueryClient,
    address: string
) {
    return queryClient.prefetchQuery({
        queryKey: transactionHistoryKeys.byAddress(address),
        queryFn: () => fetchTransactions(address),
        staleTime: 30_000,
    });
}
