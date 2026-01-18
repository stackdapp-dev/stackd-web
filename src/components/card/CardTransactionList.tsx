"use client";

/**
 * CardTransactionList Component
 * List of recent card transactions
 */
import { cn } from "@/lib/utils";
import type { CardTransaction } from "@/types/card";
import { CardTransactionItem } from "./CardTransactionItem";

interface CardTransactionListProps {
    transactions: CardTransaction[];
    isLoading?: boolean;
    showViewAll?: boolean;
    onViewAll?: () => void;
    className?: string;
}

function TransactionSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/30 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-700" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-700 rounded" />
                <div className="h-3 w-24 bg-gray-700/50 rounded" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-700 rounded" />
                <div className="h-3 w-12 bg-gray-700/50 rounded" />
            </div>
        </div>
    );
}

export function CardTransactionList({
    transactions,
    isLoading = false,
    showViewAll = true,
    onViewAll,
    className,
}: CardTransactionListProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <h3 className="text-lg font-semibold text-white">Recent transactions</h3>

            {/* Loading State */}
            {isLoading && (
                <div data-testid="transactions-loading" className="space-y-2">
                    <TransactionSkeleton />
                    <TransactionSkeleton />
                    <TransactionSkeleton />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No transactions yet</p>
                </div>
            )}

            {/* Transaction List */}
            {!isLoading && transactions.length > 0 && (
                <div className="space-y-2">
                    {transactions.map((transaction) => (
                        <CardTransactionItem
                            key={transaction.id}
                            transaction={transaction}
                        />
                    ))}
                </div>
            )}

            {/* View All Button */}
            {showViewAll && !isLoading && transactions.length > 0 && (
                <button
                    onClick={onViewAll}
                    className={cn(
                        "w-full py-4 rounded-xl",
                        "bg-gray-800/50 hover:bg-gray-700/50",
                        "border border-gray-700/50",
                        "text-gray-300 font-medium",
                        "transition-all"
                    )}
                >
                    View all transactions
                </button>
            )}
        </div>
    );
}

export default CardTransactionList;
