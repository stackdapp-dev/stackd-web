"use client";

import PageHeader from "@/components/common/PageHeader";
import TokenIcon from "@/components/common/TokenIcon";
import LoanSimulator, { type SimulatorMode } from "@/components/wallet/LoanSimulator";
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
import { Activity, AlertTriangle, DollarSign, TrendingDown, ArrowDownToLine, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoanDetailsPage() {
    const visibility = useVisibility();
    const router = useRouter();
    const [showCollateralModal, setShowCollateralModal] = useState(false);
    const [activeModal, setActiveModal] = useState<SimulatorMode | null>(null);
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
        liquidationRatio,
    } = loanCalcs;

    // Calculate health factor and yearly interest
    const healthFactor = ltv > 0 ? liquidationRatio / ltv : Infinity;
    const healthStatus = healthFactor >= 1.5 ? "safe" : healthFactor >= 1.2 ? "warning" : "danger";

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
                    setActiveModal("borrow");
                }
            } else if (borrowableAmount > MIN_BORROWABLE_AMOUNT) {
                setActiveModal("borrow");
            } else {
                setShowCollateralModal(true);
            }
        } catch (error) {
            console.error("Error during borrow process:", error);
        }
    };

    const handleAddCollateral = () => {
        setActiveModal("addCollateral");
    };

    const handleRepay = () => {
        setActiveModal("repay");
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

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
                {/* Borrow Button */}
                <button
                    onClick={handleBorrow}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
                        <ArrowDownToLine className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="text-white/70 text-sm">Borrow</span>
                </button>

                {/* Add Collateral Button */}
                <button
                    onClick={handleAddCollateral}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/30">
                        <Plus className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-white/70 text-sm text-center leading-tight">Add<br/>Collateral</span>
                </button>

                {/* Repay Loan Button */}
                <button
                    onClick={handleRepay}
                    disabled={!hasBorrowed}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:hover:bg-white/5"
                >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-500/30">
                        <RotateCcw className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-white/70 text-sm text-center leading-tight">Repay<br/>Loan</span>
                </button>
            </div>

            {/* Collateral Section */}
            <div>
                <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
                    Collateral
                </h2>
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TokenIcon symbol="WBTC" width={48} height={48} />
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
            <div className="pb-8">
                <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
                    Loan Statistics
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <Card appearance="glassDark" padding="default">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-amber-500" />
                            <p className="text-white/50 text-sm">Borrowable</p>
                        </div>
                        <p className="text-white font-bold text-xl">
                            {maskString(formatCurrency(borrowableAmount), visibility.visible, MASK_LONG)}
                        </p>
                    </Card>
                    <Card appearance="glassDark" padding="default">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <p className="text-white/50 text-sm">Liquidation Price</p>
                        </div>
                        <p className="text-white font-bold text-xl">
                            {liquidationPrice > 0
                                ? maskString(formatCurrency(liquidationPrice, 0), visibility.visible, MASK_LONG)
                                : "N/A"}
                        </p>
                    </Card>
                    <Card appearance="glassDark" padding="default">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-amber-500" />
                            <p className="text-white/50 text-sm">Health Factor</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className={`font-bold text-xl ${
                                healthStatus === "safe" ? "text-green-400" :
                                healthStatus === "warning" ? "text-orange-400" : "text-red-400"
                            }`}>
                                {isFinite(healthFactor) ? healthFactor.toFixed(2) : "N/A"}
                            </p>
                            <span className={`text-sm px-2 py-0.5 rounded-full ${
                                healthStatus === "safe" ? "bg-green-500/20 text-green-400" :
                                healthStatus === "warning" ? "bg-orange-500/20 text-orange-400" :
                                "bg-red-500/20 text-red-400"
                            }`}>
                                {healthStatus === "safe" ? "Safe" : healthStatus === "warning" ? "Warning" : "At Risk"}
                            </span>
                        </div>
                    </Card>
                    <Card appearance="glassDark" padding="default">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-amber-500" />
                            <p className="text-white/50 text-sm">Yearly Interest</p>
                        </div>
                        <p className="text-white font-bold text-xl">
                            {borrowApr.toFixed(1)}% APR
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                            ~{formatCurrency((borrowed?.usdValue || 0) * (borrowApr / 100), 2)}/year
                        </p>
                    </Card>
                </div>
            </div>

            {/* Simulator Slide-up Modal */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 transition-opacity"
                        onClick={() => setActiveModal(null)}
                    />
                    {/* Modal Content */}
                    <div className="relative w-full max-w-xl bg-slate-900 rounded-t-3xl p-6 pb-safe animate-slide-up max-h-[90vh] overflow-y-auto">
                        {/* Handle bar */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white text-xl font-semibold">
                                {activeModal === "borrow" && "Borrow USDT"}
                                {activeModal === "addCollateral" && "Add Collateral"}
                                {activeModal === "repay" && "Repay Loan"}
                            </h2>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Simulator Content */}
                        <LoanSimulator mode={activeModal} onComplete={() => setActiveModal(null)} />
                    </div>
                </div>
            )}

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
