"use client";

import { fetchTransaction, getTransactions } from "@/lib/api/transactions";
import { Transaction } from "@/types/transaction";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "./UserProvider";

type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  refetch: () => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  fetchTransactionById: (id: string) => Promise<Transaction | undefined>;
};

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.error("No access token available");
        return;
      }

      const response = await getTransactions(token, {
        populate: "order,payment_method",
        limit: 100,
      });

      setTransactions(response.data);
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

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        loading,
        refetch: fetchTransactions,
        getTransactionById,
        fetchTransactionById,
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
