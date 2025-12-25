"use client";

import { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "@/providers/Web3Provider";

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

const PAGE_SIZE = 7; // Initial visible transactions
const LOAD_MORE_SIZE = 10; // Load 10 more at a time

export function useTransactionHistory(): UseTransactionHistoryResult {
    const { activeWalletAddress } = useWeb3();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Fetch transactions
    const fetchTransactions = useCallback(async () => {
        if (!activeWalletAddress) {
            setTransactions([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                address: activeWalletAddress,
                page: "1",
                offset: "50", // Fetch more to have data for "see more"
            });

            const response = await fetch(`/api/transactions?${params}`);

            if (!response.ok) {
                throw new Error("Failed to fetch transactions");
            }

            const data = await response.json();

            if (data.status === "1") {
                setTransactions(data.result);
            } else {
                setTransactions([]);
            }
        } catch (err) {
            console.error("[History] Error fetching transactions:", err);
            setError(err instanceof Error ? err.message : "Failed to load transactions");
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeWalletAddress]);

    // Load more transactions
    const loadMore = useCallback(() => {
        setVisibleCount((prev) => Math.min(prev + LOAD_MORE_SIZE, transactions.length));
    }, [transactions.length]);

    // Initial fetch
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Reset visible count when address changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [activeWalletAddress]);

    return {
        transactions: transactions.slice(0, visibleCount),
        isLoading,
        error,
        hasMore: visibleCount < transactions.length,
        totalCount: transactions.length,
        visibleCount: Math.min(visibleCount, transactions.length),
        loadMore,
        refresh: fetchTransactions,
    };
}
