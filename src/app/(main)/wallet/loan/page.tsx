"use client";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import MaskedValue from "@/components/ui/maskedValue";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { useAutoLend } from "@/hooks/useAutoLend";
import { formatAmount, formatCurrency, formatPercent, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useVisibility } from "@/providers/visibility";
import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { AlertTriangle, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoanDetailsPage() {
    const visibility = useVisibility();
    const router = useRouter();
    const [showCollateralModal, setShowCollateralModal] = useState(false);
    const MIN_BORROWABLE_AMOUNT = 1;

    const { wbtcBalance, refetchBalances } = useWalletBalanceContext();
    const { loanCalcs, refetchLoanData } = useLoanCalculationsContext();
    const {
        ltv,
        borrowApr,
        borrowableAmount,
        liquidationPrice,
        netLoanValue,
        suppliedAssets,
        borrowedAssets,
        hasBorrowed,
        maxLtv,
    } = loanCalcs;

    const { lendProcessing, startLend } = useAutoLend({
        wbtcBalance,
        onError: () => {
            console.error("Auto lend error");
        },
    });

    const collateral = suppliedAssets.find((s) => s.symbol === "WBTC");
    const borrowed = borrowedAssets.find((b) => b.symbol === "USDT");

    // Calculate LTV bar width (capped at 100%)
    const ltvPercent = Math.min(ltv, maxLtv);
    const ltvBarWidth = maxLtv > 0 ? (ltvPercent / maxLtv) * 100 : 0;

    const handleBorrow = async () => {
        try {
            if (wbtcBalance > 0) {
                const hasLent = await startLend();
                if (hasLent) {
                    await Promise.all([refetchBalances(), refetchLoanData()]);
                    router.push("/wallet/tx/borrow");
                }
            } else if (borrowableAmount > MIN_BORROWABLE_AMOUNT) {
                router.push("/wallet/tx/borrow");
            } else {
                setShowCollateralModal(true);
            }
        } catch (error) {
            console.error("Error during borrow process:", error);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
            <PageHeader title="Loan Details" />

            {lendProcessing && (
                <Modal
                    isOpen={true}
                    onClose={() => { }}
                    title={"Confirm Transaction"}
                    message={
                        <>
                            <Text tone="muted" className="mb-3">
                                Please confirm the transaction in your wallet.
                            </Text>
                            <Loading />
                        </>
                    }
                    icon={<AlertTriangle className="text-amber-400" size={28} />}
                />
            )}

            {/* Loan Summary Card */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-amber-500/60 via-amber-600/40 to-purple-600/40">
                <Card appearance="container" className="bg-slate-900/95" padding="default">
                    <div className="flex flex-col gap-4">
                        <p className="text-amber-500 text-xs font-medium uppercase tracking-wider">
                            USDT Loan #1
                        </p>

                        <div className="flex items-baseline gap-2">
                            <MaskedValue
                                value={borrowed?.usdValue || 0}
                                mask="long"
                                className="text-4xl font-bold text-white"
                            />
                            <span className="text-white/50">borrowed</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-white/50 text-sm">Net PnL</p>
                                <p className="text-green-400 font-semibold text-lg">
                                    {maskString(formatCurrency(netLoanValue), visibility.visible, MASK_LONG)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/50 text-sm">APR</p>
                                <p className="text-white font-semibold text-lg">
                                    {maskString(formatPercent(borrowApr), visibility.visible, MASK_SHORT)}
                                </p>
                            </div>
                        </div>

                        {/* LTV Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-white/50 text-sm">Loan-to-Value Ratio</p>
                                <p className="text-amber-400 font-semibold">
                                    {maskString(formatPercent(ltv), visibility.visible, MASK_SHORT)} LTV
                                </p>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-500"
                                    style={{ width: `${ltvBarWidth}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Borrow Button */}
            <Button
                onClick={handleBorrow}
                variant="default"
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
                Borrow USDT
            </Button>

            {/* Collateral Section */}
            <div>
                <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
                    Collateral
                </h2>
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-600/30 flex items-center justify-center">
                                <span className="text-amber-400 font-bold text-lg">W</span>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Wrapped Bitcoin</p>
                                <p className="text-white/50 text-sm">WBTC</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-semibold">
                                {maskString(formatAmount(collateral?.amount || 0), visibility.visible, MASK_SHORT)} WBTC
                            </p>
                            <p className="text-white/50 text-sm">
                                {maskString(formatCurrency(collateral?.usdValue || 0), visibility.visible, MASK_LONG)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Loan Statistics */}
            <div>
                <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
                    Loan Statistics
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <Card appearance="glassDark" padding="default">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-amber-500" />
                            <p className="text-white/50 text-sm">Borrowable Amount</p>
                        </div>
                        <p className="text-white font-bold text-xl">
                            {maskString(formatCurrency(borrowableAmount), visibility.visible, MASK_LONG)}
                        </p>
                    </Card>
                    <Card appearance="glassDark" padding="default">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <p className="text-white/50 text-sm">Liquidation Point</p>
                        </div>
                        <p className="text-white font-bold text-xl">
                            {maskString(formatCurrency(liquidationPrice), visibility.visible, MASK_LONG)}
                        </p>
                    </Card>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pb-8">
                <Button
                    onClick={() => router.push("/wallet/deposit/WBTC")}
                    variant="ghost"
                    className="bg-white/5 border border-white/10 hover:bg-white/10"
                >
                    Add Collateral
                </Button>
                <Button
                    onClick={() => router.push("/wallet/tx/repay")}
                    variant="ghost"
                    className="bg-white/5 border border-white/10 hover:bg-white/10"
                    disabled={!hasBorrowed}
                >
                    Repay Loan
                </Button>
            </div>

            {/* Insufficient Collateral Modal */}
            <Modal
                isOpen={showCollateralModal}
                onClose={() => setShowCollateralModal(false)}
                title="Insufficient Collateral"
                message={
                    <>
                        <Text className="text-white/70 mb-3">
                            Your WBTC collateral is below the required amount for this action.
                        </Text>
                        <Text className="text-white/70 mb-6">
                            Please deposit more WBTC to borrow USDT.
                        </Text>
                    </>
                }
                icon={
                    <div className="bg-amber-500/10 rounded-full p-3 mb-4">
                        <AlertTriangle className="text-amber-400" size={28} />
                    </div>
                }
                primaryButtonText="Deposit"
                primaryButtonAction={() => {
                    setShowCollateralModal(false);
                    router.push("/wallet/deposit/WBTC");
                }}
                secondaryButtonText="Go back"
                secondaryButtonAction={() => {
                    setShowCollateralModal(false);
                    router.push("/wallet");
                }}
            />
        </div>
    );
}
