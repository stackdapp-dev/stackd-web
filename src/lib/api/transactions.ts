import { Status, Transaction, TransactionType } from "@/types/transaction";
import { baseUrl } from "./config";

type GetTransactionsParams = {
  type?: TransactionType;
  status?: Status;
  otcOrderId?: string;
  excludeDeleted?: string;
  populate?: "order" | "order,payment_method";
  limit?: number;
  offset?: number;
  page?: number;
};

type PaginationMetadata = {
  limit: number;
  offset: number;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type TransactionsResponse = {
  message: string;
  data: Transaction[];
  pagination: PaginationMetadata;
};

// API Functions

// 1. Get user's own transactions (with optional filters and populate)
export const getTransactions = async (
  accessToken: string,
  params?: GetTransactionsParams
): Promise<TransactionsResponse> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const url = `${baseUrl}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }

  return response.json();
};

// 2. Get single transaction by ID
export const fetchTransaction = async (
  accessToken: string,
  transactionId: string,
  params?: GetTransactionsParams
): Promise<{ message: string; data: Transaction }> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const url = `${baseUrl}/transactions/${transactionId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction: ${response.statusText}`);
  }

  return response.json();
};


