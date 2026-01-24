"use client";

import { CheckCircle, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/modal";
import TokenIcon from "@/components/common/TokenIcon";
import ConfirmationAmountCard from "./ConfirmationAmountCard";
import LtvChangeIndicator from "./LtvChangeIndicator";
import { ProcessingState } from "./ProcessingState";
import { cn, formatCurrency } from "@/lib/utils";

export interface LoanConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "addCollateral" | "withdrawCollateral" | "borrow" | "repay";
    collateralType: "WBTC" | "XAUT";
    amount: number;
    tokenSymbol: string;
    currentValue: number;
    newValue: number;
    currentLtv?: number;
    newLtv?: number;
    maxLtv?: number;
    isProcessing: boolean;
    isApproving: boolean;
    needsApproval: boolean;
    onConfirm: () => void;
    onApprove: () => void;
    warningText?: string;
}

const modeConfig = {
    addCollateral: {
        title: "Confirm Add Collateral",
        variant: "success" as const,
        displayMode: "token" as const,
        defaultWarning:
            "This will increase your collateral and reduce liquidation risk.",
        successIcon: true,
        buttonText: "Add Collateral",
        label: "Add Collateral Amount",
        valueChangeLabel: "Collateral Value",
    },
    withdrawCollateral: {
        title: "Confirm Withdraw Collateral",
        variant: "warning" as const,
        displayMode: "both" as const,
        defaultWarning:
            "This will reduce your collateral and increase liquidation risk.",
        successIcon: false,
        buttonText: "Withdraw Collateral",
        label: "Withdraw Amount",
        valueChangeLabel: "Collateral Value",
    },
    borrow: {
        title: "Confirm Borrow",
        variant: "warning" as const,
        displayMode: "usd" as const,
        defaultWarning: "This will increase your LTV and the risk of liquidation.",
        successIcon: false,
        buttonText: "Borrow",
        label: "New Borrow Amount",
        valueChangeLabel: "Current Debt",
    },
    repay: {
        title: "Confirm Repay Loan",
        variant: "success" as const,
        displayMode: "usd" as const,
        defaultWarning: "This will reduce your borrowed amount and liquidation risk.",
        successIcon: true,
        buttonText: "Repay Loan",
        label: "Repay Amount",
        valueChangeLabel: "Current Debt",
    },
};

/**
 * LoanConfirmationModal - Modal for confirming loan operations
 *
 * Features:
 * - Mode-specific title and styling (addCollateral, withdrawCollateral, borrow, repay)
 * - LTV change indicator when LTV props provided
 * - ProcessingState when isProcessing or isApproving
 * - Warning/success icons based on risk direction
 * - Approve & Continue button when needsApproval
 */
export default function LoanConfirmationModal({
    isOpen,
    onClose,
    mode,
    collateralType,
    amount,
    tokenSymbol,
    currentValue,
    newValue,
    currentLtv,
    newLtv,
    maxLtv,
    isProcessing,
    isApproving,
    needsApproval,
    onConfirm,
    onApprove,
    warningText,
}: LoanConfirmationModalProps) {
    const config = modeConfig[mode];
    const isInProcessingState = isProcessing || isApproving;
    const showLtvIndicator =
        currentLtv !== undefined && newLtv !== undefined;
    const displayWarning = warningText ?? config.defaultWarning;

    // Build modal message content
    const renderContent = () => {
        if (isInProcessingState) {
            return (
                <div className="py-8">
                    <ProcessingState
                        state={isApproving ? "approving" : "processing"}
                    />
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-6">
                {/* Header with LTV indicator */}
                {showLtvIndicator && currentLtv !== undefined && newLtv !== undefined && (
                    <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Loan-to-Value</span>
                        <LtvChangeIndicator
                            currentLtv={currentLtv}
                            newLtv={newLtv}
                            maxLtv={maxLtv}
                        />
                    </div>
                )}

                {/* Amount Card */}
                <ConfirmationAmountCard
                    label={config.label}
                    amount={amount}
                    tokenSymbol={tokenSymbol}
                    usdValue={newValue}
                    variant={config.variant}
                    displayMode={config.displayMode}
                />

                {/* Summary Section */}
                <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">{config.valueChangeLabel}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60">
                                {formatCurrency(currentValue)}
                            </span>
                            <span className="text-white/40">→</span>
                            <span className="text-white">
                                {formatCurrency(newValue)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Warning/Success Banner */}
                <div
                    className={cn(
                        "flex items-center gap-3 p-4 rounded-xl",
                        config.successIcon
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "bg-amber-500/10 border border-amber-500/20"
                    )}
                >
                    {config.successIcon ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    )}
                    <span className="text-sm text-white/80">{displayWarning}</span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={needsApproval ? onApprove : onConfirm}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all",
                            "bg-gradient-to-br from-[#ffa02d] to-[#ff8c00]",
                            "hover:shadow-[0_0_20px_rgba(255,160,45,0.5)]"
                        )}
                    >
                        {needsApproval ? "Approve & Continue" : config.buttonText}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={config.title}
            icon={<TokenIcon symbol={tokenSymbol} width={64} height={64} />}
            message={renderContent()}
            showActionButtons={false}
        />
    );
}
