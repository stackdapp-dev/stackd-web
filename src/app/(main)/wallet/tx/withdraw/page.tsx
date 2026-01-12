"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { getTokenMetadata } from "@/constants/Tokens";
import { useCollateralBreakdown } from "@/hooks/useCollateralBreakdown";
import { useCompound } from "@/hooks/useCompound";
import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { formatAmount, formatCurrency } from "@/lib/utils";
import { AlertTriangle, Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { parseUnits } from "viem";

export default function WithdrawCollateralPage() {
    const router = useRouter();
    const [amount, setAmount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ackChecked, setAckChecked] = useState(false);

    const { breakdown, canWithdraw } = useCollateralBreakdown();
    const { withdraw } = useCompound();
    const { refetchBalances } = useWalletBalanceContext();
    const { refetchLoanData } = useLoanCalculationsContext();

    const available = breakdown.availableToWithdrawBtc;
    const withdrawCheck = canWithdraw(amount);

    // Apply 1% safety buffer to max withdrawal to account for precision differences
    // between JS floating-point calculations and Compound's on-chain uint256 math
    const safeMaxWithdraw = available * 0.99;

    const handleMax = useCallback(() => {
        setAmount(safeMaxWithdraw);
    }, [safeMaxWithdraw]);

    const handleAction = useCallback(async () => {
        if (isProcessing || amount <= 0) return;

        const check = canWithdraw(amount);
        if (!check.allowed) {
            console.error("Withdrawal blocked:", check.reason);
            return;
        }

        setIsProcessing(true);
        try {
            const tokenMeta = getTokenMetadata("WBTC");
            if (!tokenMeta) throw new Error("WBTC metadata not found");

            const tokenAddress = tokenMeta.address as `0x${string}`;
            const amountBigInt = parseUnits(String(amount), tokenMeta.decimals);

            const result = await withdraw(tokenAddress, amountBigInt);
            if (result.error) throw new Error(result.error);

            await Promise.all([refetchBalances(), refetchLoanData()]);
            router.push("/wallet");
        } catch (err) {
            console.error("Withdraw failed:", err);
        } finally {
            setIsProcessing(false);
        }
    }, [amount, isProcessing, canWithdraw, withdraw, refetchBalances, refetchLoanData, router]);

    // Button disabled conditions
    const isDisabled =
        available <= 0 ||
        amount <= 0 ||
        isProcessing ||
        !ackChecked ||
        !withdrawCheck.allowed;

    return (
        <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
            <PageHeader title="Withdraw Collateral" />

            {/* Collateral Summary */}
            <Card appearance="glassDark" padding="default">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Total Collateral</span>
                        <span className="text-white font-semibold">
                            {formatAmount(breakdown.totalCollateralBtc, 4)} WBTC
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span className="text-white/70 text-sm">Locked (backing loans)</span>
                        </div>
                        <span className="text-amber-400 font-semibold">
                            {formatAmount(breakdown.lockedCollateralBtc, 4)} WBTC
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-white/70 text-sm">Available to Withdraw</span>
                        </div>
                        <span className="text-emerald-400 font-semibold">
                            {available < 0.0001 && available > 0
                                ? "< 0.0001"
                                : formatAmount(available, 4)} WBTC
                        </span>
                    </div>
                </div>
            </Card>

            {/* Amount Input */}
            <div className="flex flex-col gap-2">
                <InputAmountCard
                    label="Amount"
                    value={String(amount)}
                    onChangeText={(value) => setAmount(Number(value))}
                    tokenSymbol="WBTC"
                    usdValue={amount * (breakdown.totalCollateralUsd / breakdown.totalCollateralBtc || 0)}
                    availableAmount={available}
                    onMaxPress={handleMax}
                    editable={!isProcessing}
                />

                {/* Error messages */}
                {!withdrawCheck.allowed && amount > 0 && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm leading-relaxed">{withdrawCheck.reason}</p>
                    </div>
                )}
            </div>

            {/* Warning for partial withdrawal */}
            {available > 0 && breakdown.lockedCollateralBtc > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-400 font-semibold text-sm">Collateral Restriction</p>
                            <p className="text-white/80 text-sm mt-2 leading-relaxed">
                                You have <span className="text-amber-400 font-medium">{formatCurrency(breakdown.lockedCollateralUsd)}</span> of collateral locked to back your loans.
                                Withdrawing more than <span className="text-emerald-400 font-medium">{available < 0.0001 ? "< 0.0001" : formatAmount(available, 4)} WBTC</span> would under-collateralize your position.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Acknowledgment */}
            <label htmlFor="ack" className="flex items-start gap-3 cursor-pointer group">
                <input
                    type="checkbox"
                    id="ack"
                    checked={ackChecked}
                    onChange={() => setAckChecked((v) => !v)}
                    aria-checked={ackChecked}
                    className="mt-0.5 w-5 h-5 rounded border-white/30 bg-white/5 checked:bg-amber-500 checked:border-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                />
                <span className="text-sm text-white/80 leading-relaxed group-hover:text-white transition-colors">
                    I understand withdrawing collateral may affect my loan health factor.
                </span>
            </label>

            {/* Action Button */}
            <Button onClick={handleAction} className="w-full" disabled={isDisabled}>
                {isProcessing ? "Processing..." : "Withdraw WBTC"}
            </Button>
        </div>
    );
}
