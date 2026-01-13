"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import LoanSimulator from "@/components/wallet/LoanSimulator";
import { showInfoToast } from "@/components/ui/custom-toast";
import { formatPercent, maskString, MASK_SHORT } from "@/lib/utils";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useVisibility } from "@/providers/visibility";
import { useRouter } from "next/navigation";

export default function ActiveLoans() {
    const router = useRouter();
    const visibility = useVisibility();
    const { loanCalcs } = useLoanCalculationsContext();
    const [showSimulatorModal, setShowSimulatorModal] = useState(false);
    const { ltv, borrowApr, borrowedAssets, maxLtv, suppliedAssets } = loanCalcs;

    // Check if user has WBTC collateral
    const wbtcCollateral = suppliedAssets.find((a) => a.symbol === "WBTC");
    const hasCollateral = (wbtcCollateral?.amount || 0) > 0;

    const handleBorrowClick = () => {
        if (!hasCollateral) {
            showInfoToast("Bitcoin deposit required before borrowing");
            setTimeout(() => {
                router.push("/wallet/deposit/BTC");
            }, 2000);
            return;
        }
        setShowSimulatorModal(true);
    };

    // Check if there's an active loan
    const hasActiveLoan = borrowedAssets.some((b) => b.amount > 0);

    // Calculate LTV bar width (capped at 100%)
    const ltvPercent = Math.min(ltv, maxLtv);
    const ltvBarWidth = maxLtv > 0 ? (ltvPercent / maxLtv) * 100 : 0;

    return (
        <div className="px-4">
            {/* Section Header */}
            <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
                Active Loans
            </h2>

            {hasActiveLoan ? (
                // Loan Card - when user has active loan
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
                            <p className="text-white font-semibold">Arbitrum</p>
                            <p className="text-white/50 text-sm">{maskString(formatPercent(borrowApr), visibility.visible, MASK_SHORT)} APR</p>
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
                        <p className="text-white/60 text-sm mt-1">{maskString(formatPercent(ltv), visibility.visible, MASK_SHORT)} LTV</p>
                    </div>
                </Card>
            ) : (
                // Borrow USDT Button - for fresh wallets
                <Button
                    onClick={handleBorrowClick}
                    size="lg"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                    Borrow USDT
                </Button>
            )}

            {/* Simulator Slide-up Modal */}
            {showSimulatorModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 transition-opacity"
                        onClick={() => setShowSimulatorModal(false)}
                    />
                    {/* Modal Content */}
                    <div className="relative w-full max-w-xl bg-slate-900 rounded-t-3xl p-6 pb-safe animate-slide-up max-h-[90vh] overflow-y-auto">
                        {/* Handle bar */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white text-xl font-semibold">Borrow USDT</h2>
                            <button
                                onClick={() => setShowSimulatorModal(false)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Simulator Content */}
                        <LoanSimulator />
                    </div>
                </div>
            )}
        </div>
    );
}
