"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import Text from "@/components/ui/text";
import { getTokenMetadata } from "@/constants/Tokens";
import { useCollateralBreakdown } from "@/hooks/useCollateralBreakdown";
import { useCompound } from "@/hooks/useCompound";
import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
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

    const handleMax = useCallback(() => {
        setAmount(available);
    }, [available]);

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
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Text tone="muted">Total Collateral</Text>
                        <Text weight="semibold">
                            {formatAmount(breakdown.totalCollateralBtc)} WBTC
                        </Text>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <Text tone="muted">Locked (backing loans)</Text>
                        </div>
                        <Text weight="semibold" className="text-amber-400">
                            {formatAmount(breakdown.lockedCollateralBtc)} WBTC
                        </Text>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <Text tone="muted">Available to Withdraw</Text>
                        </div>
                        <Text weight="semibold" className="text-emerald-400">
                            {formatAmount(available)} WBTC
                        </Text>
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
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <Text className="text-red-400 text-sm">{withdrawCheck.reason}</Text>
                    </div>
                )}
            </div>

            {/* Warning for partial withdrawal */}
            {available > 0 && breakdown.lockedCollateralBtc > 0 && (
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <Text className="text-amber-400 font-medium">Collateral Restriction</Text>
                            <Text tone="muted" className="text-sm mt-1">
                                You have {formatCurrency(breakdown.lockedCollateralUsd)} of collateral locked to back your loans.
                                Withdrawing more than {formatAmount(available)} WBTC would under-collateralize your position.
                            </Text>
                        </div>
                    </div>
                </Card>
            )}

            {/* Acknowledgment */}
            <div className="flex items-start justify-center gap-3">
                <input
                    type="checkbox"
                    id="ack"
                    checked={ackChecked}
                    onChange={() => setAckChecked((v) => !v)}
                    aria-checked={ackChecked}
                    className="mt-1"
                />
                <label htmlFor="ack" className="text-sm text-white/70 cursor-pointer">
                    I understand withdrawing collateral may affect my loan health factor.
                </label>
            </div>

            {/* Action Button */}
            <Button onClick={handleAction} className="w-full" disabled={isDisabled}>
                {isProcessing ? "Processing..." : "Withdraw WBTC"}
            </Button>
        </div>
    );
}
