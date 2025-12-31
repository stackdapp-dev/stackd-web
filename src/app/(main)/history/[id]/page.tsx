"use client";

import PageHeader from "@/components/common/PageHeader";
import { TransactionProgressIndicator } from "@/components/transactions";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { arbiscanUrl } from "@/lib/api/config";
import { formatAmount, formatDate } from "@/lib/utils";
import { useTransactions } from "@/providers/TransactionsProvider";
import { MIN_PHP_AMOUNT_NO_FEE } from "@/providers/WithrawOTCProvider";
import { Transaction } from "@/types/transaction";
import { Copy, ExternalLink, InfoIcon } from "lucide-react";
import { use, useEffect, useState } from "react";
import { formatUnits } from "viem";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    getTransactionById,
    fetchTransactionById,
    loading: transactionsLoading,
    getTransactionTitle,
    mapStatus,
    statusBadge,
  } = useTransactions();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [showCopied, setShowCopied] = useState(false);

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

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (transactionsLoading || !tx) {
    return (
      <Modal
        isOpen={true}
        onClose={() => {}}
        title=""
        message="Loading transaction..."
        icon={<Loading size="lg" />}
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

      <TransactionProgressIndicator status={tx.status} type={tx.type} />

      <Card appearance="container" className="rounded-xl overflow-hidden mb-4">
        <div className="relative">
          <div className="flex items-start justify-between">
            <Text weight="semibold">{getTransactionTitle(tx.type)}</Text>
            <span className={statusBadge(displayStatus)}>{displayStatus}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <Text tone="muted">Withdraw Amount</Text>
            <Text className="text-right">
              {amount} {order?.crypto || "USDT"}
            </Text>

            {order && (
              <>
                <Text tone="muted">Exchange Rate</Text>
                <Text className="text-right">
                  {order.status === "fulfilled"
                    ? (Number(order.fiatAmountTransferred) / amount).toFixed(2)
                    : `~ ${order.quotedRate}`}{" "}
                  {order.fiat}/{order.crypto}
                </Text>

                {Number(order.flatFee) === 0 ? (
                  <>
                    <Text tone="muted">
                      {order.status === "fulfilled"
                        ? "Amount Received"
                        : "Amount to Receive"}
                    </Text>
                    <Text className="text-right">
                      {formatAmount(
                        order.status === "fulfilled"
                          ? parseFloat(order.fiatAmountTransferred)
                          : parseFloat(order.fiatAmount)
                      )}{" "}
                      {order.fiat}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text tone="muted">Subtotal</Text>
                    <Text className="text-right">
                      {formatAmount(parseFloat(order.fiatAmount))} {order.fiat}
                    </Text>

                    <Tooltip>
                      <TooltipTrigger>
                        <Text className="flex items-center gap-1" tone="muted">
                          Flat Fee <InfoIcon size={16} />{" "}
                        </Text>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          A {Number(order.flatFee)} PHP flat fee applies to
                          withdrawals below{" "}
                          {formatAmount(MIN_PHP_AMOUNT_NO_FEE)} PHP
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Text className="text-right">
                      {formatAmount(parseFloat(order.flatFee))} {order.fiat}
                    </Text>

                    <Text tone="muted">
                      {order.status === "fulfilled"
                        ? "Amount Received"
                        : "Amount to Receive"}
                    </Text>
                    <Text className="text-right">
                      {formatAmount(
                        order.status === "fulfilled"
                          ? parseFloat(order.fiatAmountTransferred)
                          : parseFloat(order.fiatAmount) - Number(order.flatFee)
                      )}{" "}
                      {order.fiat}
                    </Text>
                  </>
                )}

                <Text tone="muted">Order Number</Text>
                <div className="flex items-center justify-end gap-2">
                  <Text className="text-right text-xs">
                    {order.orderNumber}
                  </Text>
                  <Tooltip open={showCopied}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Copy order number"
                        className="p-1 text-neutral-400 hover:text-primary transition-colors"
                        onClick={() => handleCopy(order.orderNumber)}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Copied!</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Text tone="muted">Transaction Hash</Text>
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

            <Text tone="muted">Last Updated</Text>
            <Text className="text-right">{formatDate(tx.updatedAt)}</Text>
          </div>
        </div>
      </Card>

      {paymentMethod && (
        <div>
          <Text className="text-amber-400 text-sm">Recipient Details</Text>
          <Card
            appearance="container"
            className="rounded-xl overflow-hidden mt-2"
          >
            <div className="text-sm space-y-2">
              {paymentMethod.eWalletName && (
                <div className="flex justify-between">
                  <Text tone="muted">E-wallet Name</Text>
                  <Text>{paymentMethod.eWalletName}</Text>
                </div>
              )}
              {paymentMethod.bankName && (
                <div className="flex justify-between">
                  <Text tone="muted">Bank Name</Text>
                  <Text>{paymentMethod.bankName}</Text>
                </div>
              )}
              {paymentMethod.accountName && (
                <div className="flex justify-between">
                  <Text tone="muted">Account Name</Text>
                  <Text>{paymentMethod.accountName}</Text>
                </div>
              )}
              {paymentMethod.phoneNumber && (
                <div className="flex justify-between">
                  <Text tone="muted">Mobile Number</Text>
                  <Text>{paymentMethod.phoneNumber}</Text>
                </div>
              )}
              {paymentMethod.email && (
                <div className="flex justify-between">
                  <Text tone="muted">E-mail Address</Text>
                  <Text>{paymentMethod.email}</Text>
                </div>
              )}
              {paymentMethod.bankAccountNumber && (
                <div className="flex justify-between">
                  <Text tone="muted">Account Number</Text>
                  <Text>{paymentMethod.bankAccountNumber}</Text>
                </div>
              )}
              {paymentMethod.alias && (
                <div className="flex justify-between">
                  <Text tone="muted">Alias</Text>
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
