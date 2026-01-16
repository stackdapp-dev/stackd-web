"use client";

import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import { ArrowUpRight } from "lucide-react";

interface StatCardsProps {
    cashBalance: number;
    holdingsBalance: number;
    isLoading?: boolean;
}

export default function StatCards({ cashBalance, holdingsBalance, isLoading = false }: StatCardsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 px-4" data-testid="stat-cards-loading-skeleton">
                {/* CASH Card Skeleton */}
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-3 w-10 bg-white/10 rounded skeleton-shimmer" />
                        <div className="w-4 h-4 bg-white/10 rounded skeleton-shimmer" />
                    </div>
                    <div className="h-6 w-24 bg-white/10 rounded skeleton-shimmer" />
                </Card>

                {/* HOLDINGS Card Skeleton */}
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-3 w-16 bg-white/10 rounded skeleton-shimmer" />
                    </div>
                    <div className="h-6 w-24 bg-white/10 rounded skeleton-shimmer" />
                </Card>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 px-4">
            {/* CASH Card */}
            <Card appearance="glassDark" padding="default">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider">Cash</span>
                    <ArrowUpRight className="w-4 h-4 text-white/40" />
                </div>
                <div className="flex items-center gap-2">
                    <MaskedValue
                        value={cashBalance}
                        mask="long"
                        className="text-xl font-semibold text-white"
                    />
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
            </Card>

            {/* HOLDINGS Card */}
            <Card appearance="glassDark" padding="default">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider">Holdings</span>
                </div>
                <MaskedValue
                    value={holdingsBalance}
                    mask="long"
                    className="text-xl font-semibold text-white"
                />
            </Card>
        </div>
    );
}
