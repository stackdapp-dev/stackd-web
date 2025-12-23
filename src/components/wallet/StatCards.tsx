"use client";

import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import { ArrowUpRight } from "lucide-react";

interface StatCardsProps {
    cashBalance: number;
    holdingsBalance: number;
}

export default function StatCards({ cashBalance, holdingsBalance }: StatCardsProps) {
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
