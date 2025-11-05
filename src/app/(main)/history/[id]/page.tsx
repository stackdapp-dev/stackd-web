"use client";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { arbiscanUrl } from "@/lib/api/config";
import { formatAmount, formatDate } from "@/lib/utils";
import { useTransactions } from "@/providers/TransactionsProvider";
import { DisplayStatus, Status, Transaction, TransactionType } from "@/types/transaction";
import { Copy, ExternalLink } from "lucide-react";
import { use, useEffect, useState } from "react";
import { formatUnits } from "viem";

const getTransactionTitle = (type: TransactionType): string => {
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
};

const mapStatus = (status: Status): DisplayStatus => {
  switch (status) {
    case "pending":
      return "Pending";
    case "completed":
      return "Fulfilled";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
};

const statusBadge = (status: DisplayStatus) => {
  switch (status) {
    case "Pending":
      return "bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs font-semibold";
    case "Fulfilled":
      return "bg-emerald-500 text-black px-2 py-0.5 rounded-full text-xs font-semibold";
    case "Failed":
      return "bg-rose-500 text-black px-2 py-0.5 rounded-full text-xs font-semibold";
  }
};


export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTransactionById, fetchTransactionById, loading: transactionsLoading } = useTransactions();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // From all transactions first
    const cachedTx = getTransactionById(id);
    if (cachedTx) {
      setTx(cachedTx);
      return;
    }

    // Wait for all transactions to load first
    if (transactionsLoading) {
      return;
    }

    // If not found in all transactions, fetch by id
    const fetchTransaction = async () => {
      const response = await fetchTransactionById(id);
      if (response) {
        setTx(response);
      }
    };

    fetchTransaction();
  }, [id, transactionsLoading, getTransactionById, fetchTransactionById]);

  const handleCopy = (text: string, key: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(key);
        window.setTimeout(() => setCopied(null), 1800);
      },
      () => {
        /* ignore */
      }
    );
  };

  if (transactionsLoading || !tx) {
    return (
      <Modal
        isOpen={true}
        onClose={() => {}}
        title=""
        message="Loading transaction..."
        showCloseButton={false}
        showActionButtons={false}
      />
    );
  }

  const displayStatus = mapStatus(tx.status);
  const amount = parseFloat(formatUnits(BigInt(tx.amount), 6));
  const order = tx.order;
  const paymentMethod = tx.paymentMethod;

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title="Order Details" />

      <Card appearance="container" className="rounded-xl overflow-hidden mb-4">
        <div className="relative">
          <div className="flex items-start justify-between">
            <Text weight="semibold">{getTransactionTitle(tx.type)}</Text>
            <span className={statusBadge(displayStatus)}>{displayStatus}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <Text tone="muted">
              Withdraw Amount
            </Text>
            <Text className="text-right">
              {amount} {order?.crypto || "USDT"}
            </Text>

            {order && (
              <>
                <Text tone="muted">
                  Amount to Receive
                </Text>
                <Text className="text-right">
                  {formatAmount(parseFloat(order.fiatAmount))} {order.fiat}
                </Text>

                <Text tone="muted">
                  Exchange Rate
                </Text>
                <Text className="text-right">
                  1 {order.crypto} ≈ {order.quotedRate} {order.fiat}
                </Text>

                <Text tone="muted">
                  Order Number
                </Text>
                <div className="flex items-center justify-end gap-2">
                  <Text className="text-right text-xs">
                    {order.orderNumber}
                  </Text>
                  <button type="button" aria-label="Copy order number" className="p-1 rounded" onClick={() => handleCopy(order.orderNumber, "order")}>
                    <Copy className={`h-4 w-4 ${copied === "order" ? "text-amber-400" : "text-neutral-400"}`} />
                  </button>
                </div>

                <Text tone="muted">
                  Transaction Hash
                </Text>
                <a 
                  href={`${arbiscanUrl}/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-end gap-2 hover:text-amber-400 transition-colors"
                >
                  <Text className="text-right text-xs">
                    {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                  </Text>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                </a>
              </>
            )}

            <Text tone="muted">
              Last Updated
            </Text>
            <Text className="text-right">
              {formatDate(tx.updatedAt)}
            </Text>
          </div>
        </div>
      </Card>

      {paymentMethod && (
        <div>
          <Text className="text-amber-400 text-sm">Recipient Details</Text>
          <Card appearance="container" className="rounded-xl overflow-hidden mt-2">
            <div className="text-sm space-y-2">
              {paymentMethod.eWalletName && (
                <div className="flex justify-between">
                  <Text tone="muted">
                    E-wallet Name
                  </Text>
                  <Text>{paymentMethod.eWalletName}</Text>
                </div>
              )}
              {paymentMethod.bankName && (
                <div className="flex justify-between">
                  <Text tone="muted">
                    Bank Name
                  </Text>
                  <Text>{paymentMethod.bankName}</Text>
                </div>
              )}
              {paymentMethod.accountName && (
                <div className="flex justify-between">
                  <Text tone="muted">
                    Account Name
                  </Text>
                  <Text>{paymentMethod.accountName}</Text>
                </div>
              )}
              {paymentMethod.phoneNumber && (
                <div className="flex justify-between">
                  <Text tone="muted">
                    Mobile Number
                  </Text>
                  <Text>{paymentMethod.phoneNumber}</Text>
                </div>
              )}
              {paymentMethod.email && (
                <div className="flex justify-between">
                  <Text tone="muted">
                    E-mail Address
                  </Text>
                  <Text>{paymentMethod.email}</Text>
                </div>
              )}
              {paymentMethod.bankAccountNumber && (
                <div className="flex justify-between">
                  <Text tone="muted">
                    Account Number
                  </Text>
                  <Text>{paymentMethod.bankAccountNumber}</Text>
                </div>
              )}
              {paymentMethod.alias && (
                <div className="flex justify-between">
                  <Text tone="muted">
                    Alias
                  </Text>
                  <Text>{paymentMethod.alias}</Text>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tx.type === "otc_withdrawal" && displayStatus === "Fulfilled" && (
        <Button className="w-full">Order Again</Button>
      )}
    </div>
  );
}
