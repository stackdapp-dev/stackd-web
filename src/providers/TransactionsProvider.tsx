"use client";

import { fetchTransaction, getTransactions } from "@/lib/api/transactions";
import { DisplayStatus, Status, Transaction, TransactionType } from "@/types/transaction";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "./UserProvider";

type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  refetch: () => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  fetchTransactionById: (id: string) => Promise<Transaction | undefined>;
  getTransactionTitle: (type: TransactionType) => string;
  mapStatus: (status: Status) => DisplayStatus;
  statusBadge: (status: DisplayStatus) => string;
};

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

interface TransactionsCache {
  data: Transaction[];
  timestamp: number;
}

const transactionsCache = new Map<string, TransactionsCache>();
const CACHE_TTL = 15000; // 15 seconds

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async (forceRefresh: boolean = false) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.error("No access token available");
        return;
      }

      const cacheKey = `transactions_${token}`;
      const now = Date.now();

      // Check cache unless forced refresh
      if (!forceRefresh) {
        const cached = transactionsCache.get(cacheKey);
        if (cached && now - cached.timestamp < CACHE_TTL) {
          // Use cached data
          setTransactions(cached.data);
          setLoading(false);
          return;
        }
      }

      const response = await getTransactions(token, {
        populate: "order,payment_method",
        limit: 100,
      });

      setTransactions(response.data);

      // Update cache
      transactionsCache.set(cacheKey, {
        data: response.data,
        timestamp: now,
      });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getTransactionById = useCallback(
    (id: string) => {
      return transactions.find((tx) => tx.id === id);
    },
    [transactions]
  );

  const fetchTransactionById = useCallback(
    async (id: string): Promise<Transaction | undefined> => {
      try {
        const token = await getAccessToken();
        if (!token) return undefined;

        const response = await fetchTransaction(token, id, {
          populate: "order,payment_method",
        });

        return response.data;
      } catch (error) {
        console.error("Failed to fetch transaction:", error);
        return undefined;
      }
    },
    [getAccessToken]
  );

  const getTransactionTitle = useCallback((type: TransactionType): string => {
    switch (type) {
      case "otc_withdrawal":
        return "OTC Withdrawal";
      case "otc_refund":
        return "OTC Refund";
      case "deposit":
        return "Deposit";
      case "transfer":
        return "Transfer";
      default:
        return "Transaction";
    }
  }, []);

  const mapStatus = useCallback((status: Status): DisplayStatus => {
    switch (status) {
      case "open":
        return "Pending";
      case "processing":
        return "Pending";
      case "failed":
        return "Failed";
      case "fulfilled":
        return "Fulfilled";
      case "refunded":
        return "Refunded";
      default:
        return "Pending";
    }
  }, []);

  const statusBadge = useCallback((status: DisplayStatus): string => {
    switch (status) {
      case "Pending":
        return "bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs";
      case "Fulfilled":
        return "bg-green-500 text-black px-2 py-0.5 rounded-full text-xs";
      case "Failed":
        return "bg-red-500 text-black px-2 py-0.5 rounded-full text-xs";
      case "Refunded":
        return "bg-blue-500 text-black px-2 py-0.5 rounded-full text-xs";
    }
  }, []);

  const refetch = useCallback(() => fetchTransactions(true), [fetchTransactions]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        loading,
        refetch,
        getTransactionById,
        fetchTransactionById,
        getTransactionTitle,
        mapStatus,
        statusBadge,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return context;
};
