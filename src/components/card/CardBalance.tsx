"use client";

/**
 * CardBalance Component
 * Card balance display with limit progress
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import type { CardDetails } from "@/types/card";
import { calculateLimitPercentage } from "@/lib/card/cardUtils";

interface CardBalanceProps {
    card: CardDetails;
    onSettings?: () => void;
    className?: string;
}

export function CardBalance({ card, onSettings, className }: CardBalanceProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Split balance into dollars and cents for styling
    const balanceStr = Math.abs(card.balance).toFixed(2);
    const [dollars, cents] = balanceStr.split(".");
    const formattedDollars = new Intl.NumberFormat("en-US").format(Number(dollars));

    const limitPercentage = calculateLimitPercentage(card.balance, card.limit);
    const formattedLimit = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(card.limit);

    return (
        <div
            className={cn(
                "bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Card Balance
                </span>
                <button
                    data-testid="settings-icon"
                    onClick={onSettings}
                    className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                >
                    <Settings className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Balance */}
            <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-white">${formattedDollars}</span>
                <span className="text-xl text-gray-400">.{cents}</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
                <div
                    data-testid="limit-progress-bar"
                    className="h-1 bg-gray-700 rounded-full overflow-hidden"
                >
                    <div
                        data-testid="progress-fill"
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                        style={{ width: `${limitPercentage}%` }}
                    />
                </div>
            </div>

            {/* Limit */}
            <div className="flex justify-end mb-4">
                <span className="text-xs text-gray-500">
                    LIMIT {formattedLimit}
                </span>
            </div>

            {/* View Balances Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full py-3 px-4 rounded-xl",
                    "bg-gray-700/50 hover:bg-gray-600/50",
                    "border border-gray-600/50",
                    "flex items-center justify-center gap-2",
                    "text-gray-300 text-sm font-medium",
                    "transition-all"
                )}
            >
                View balances
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div
                    data-testid="balances-expanded"
                    className="mt-4 pt-4 border-t border-gray-700/50 space-y-3"
                >
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Available</span>
                        <span className="text-white font-medium">
                            {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                            }).format(card.limit - Math.abs(card.balance))}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Spent</span>
                        <span className="text-white font-medium">
                            {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                            }).format(Math.abs(card.balance))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CardBalance;
