import { baseUrl } from "./config";

// Types based on your backend schema
type TransactionType = "otc_withdrawal" | "otc_refund" | "deposit" | "transfer";
type TransactionStatus = "completed" | "pending" | "failed";

type PaymentMethod = {
  id: string;
  type: "bank" | "e-wallet";
  accountName: string;
  email: string;
  phoneNumber: string;
  bankName?: string;
  bankAccountNumber?: string;
  eWalletName?: string;
  alias?: string;
};

type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  date: string;
  otcOrderId: string;
  txHash: string;
  amount: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  order?: Order | null;
  paymentMethod?: PaymentMethod | null;
};

type Order = {
  id: string;
  userId: string;
  orderNumber: string;
  crypto: string;
  cryptoAmount: string;
  fiat: string;
  fiatAmount: string;
  paymentMethodMetadata: string;
  transferTxHash: string;
  quotedRate: string;
  status: string;
  hasNotified: boolean;
  platformFee: string;
  createdAt: string;
  updatedAt: string;
};

type GetTransactionsParams = {
  type?: TransactionType;
  status?: TransactionStatus;
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


