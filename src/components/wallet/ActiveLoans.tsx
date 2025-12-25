"use client";

import Card from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useRouter } from "next/navigation";

export default function ActiveLoans() {
    const router = useRouter();
    const { loanCalcs } = useLoanCalculationsContext();
    const { ltv, borrowApr, borrowedAssets, netLoanValue, maxLtv } = loanCalcs;

    // Check if there's an active loan
    const hasActiveLoan = borrowedAssets.some((b) => b.amount > 0);
    const borrowedAmount = borrowedAssets.find((b) => b.symbol === "USDT")?.usdValue || 0;

    if (!hasActiveLoan) {
        return null;
    }

    // Calculate LTV bar width (capped at 100%)
    const ltvPercent = Math.min(ltv, maxLtv);
    const ltvBarWidth = maxLtv > 0 ? (ltvPercent / maxLtv) * 100 : 0;

    return (
        <div className="px-4">
            {/* Section Header */}
            <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
                Active Loans
            </h2>

            {/* Loan Card */}
            <Card
                appearance="glassDark"
                className="cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => router.push("/wallet/loan")}
            >
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-white font-semibold">USDT Loan #1</h3>
                        <p className="text-white/50 text-sm">Using WBTC as collateral</p>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-semibold">
                            Net PnL: <span className="text-green-400">{formatCurrency(netLoanValue)}</span>
                        </p>
                        <p className="text-white/50 text-sm">{formatPercent(borrowApr)} APR</p>
                    </div>
                </div>

                {/* LTV Progress Bar */}
                <div className="mt-2">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${ltvBarWidth}%` }}
                        />
                    </div>
                    <p className="text-white/60 text-sm mt-1">{formatPercent(ltv)} LTV</p>
                </div>
            </Card>
        </div>
    );
}
