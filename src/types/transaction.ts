export type Status = "open" | "processing" | "failed" | "fulfilled" | "refunded";
export type DisplayStatus = "Pending" | "Fulfilled" | "Failed" | "Refunded";

export type TransactionType =
  | "otc_withdrawal"
  | "otc_refund"
  | "deposit"
  | "transfer";

export type PaymentMethod = {
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

export type Order = {
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
  flatFee: string;
  fiatAmountTransferred: string;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  date: string;
  otcOrderId: string;
  txHash: string;
  amount: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  order?: Order | null;
  paymentMethod?: PaymentMethod | null;
};
