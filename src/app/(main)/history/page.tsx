"use client";

import Card from "@/components/ui/card";
import { SkeletonRow } from "@/components/ui/skeleton";
import Text from "@/components/ui/text";
import BetaBadge from "@/components/ui/BetaBadge";
import { formatAmount } from "@/lib/utils";
import { calculateTransactionUsdValue } from "@/lib/transactionUtils";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { formatUnits } from "viem";

// Arbiscan base URL for Arbitrum One
const ARBISCAN_TX_URL = "https://arbiscan.io/tx/";

// Format timestamp to relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return new Date(timestamp).toLocaleDateString();
};

// Truncate hash for display
const truncateHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

const History = () => {
  const {
    transactions,
    isLoading,
    error,
    hasMore,
    totalCount,
    visibleCount,
    loadMore,
    refresh,
  } = useTransactionHistory();
  const getPrice = useGetTokenPrice();

  // Format transaction for display
  const formattedTransactions = useMemo(() => {
    return transactions.map((tx) => {
      const amount = parseFloat(formatUnits(BigInt(tx.value || "0"), tx.decimals));
      const usdValue = calculateTransactionUsdValue(amount, tx.symbol, getPrice);

      return {
        ...tx,
        formattedAmount: formatAmount(amount),
        formattedUsd: formatAmount(usdValue),
        relativeTime: formatRelativeTime(tx.timestamp),
        title: tx.type === "receive" ? `Receive ${tx.symbol}` : `Send ${tx.symbol}`,
      };
    });
  }, [transactions, getPrice]);

  // Open transaction in Arbiscan
  const openInArbiscan = (hash: string) => {
    window.open(`${ARBISCAN_TX_URL}${hash}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-6">
      {/* BETA Badge */}
      <div className="flex justify-center">
        <BetaBadge />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-semibold">History</h1>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-5 w-5 text-white/60 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Transaction count */}
      {!isLoading && transactions.length > 0 && (
        <Text className="text-white/50 text-sm">
          Showing {visibleCount} of {totalCount} transactions
        </Text>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Text className="text-red-400">{error}</Text>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && transactions.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <Text className="text-white/60">No transactions found</Text>
        </div>
      )}

      {/* Transaction list */}
      {!isLoading && !error && transactions.length > 0 && (
        <div className="flex flex-col gap-3">
          {formattedTransactions.map((tx) => {
            const isReceive = tx.type === "receive";

            return (
              <button
                key={`${tx.hash}-${tx.timestamp}`}
                onClick={() => openInArbiscan(tx.hash)}
                className="text-left"
              >
                <Card
                  appearance="glassDark"
                  padding="default"
                  className="rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReceive ? "bg-emerald-500/20" : "bg-amber-500/20"
                      }`}>
                      {isReceive ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-amber-500" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Text weight="semibold" className="text-white">
                        {tx.title}
                      </Text>
                      <Text className="text-white/50 text-sm">
                        {truncateHash(tx.hash)} • {tx.relativeTime}
                      </Text>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <Text className={`font-semibold ${isReceive ? "text-emerald-400" : "text-white"}`}>
                        {isReceive ? "+" : "-"}{tx.formattedAmount} {tx.symbol}
                      </Text>
                      <Text className="text-white/50 text-sm">
                        ${tx.formattedUsd}
                      </Text>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}

          {/* See More button - inline at bottom of list */}
          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/15 transition-colors"
            >
              See More ({totalCount - visibleCount} more)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
