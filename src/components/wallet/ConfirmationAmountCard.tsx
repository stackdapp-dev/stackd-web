"use client";

import { cn, formatAmount, formatCurrency } from "@/lib/utils";
import TokenIcon from "@/components/common/TokenIcon";

export interface ConfirmationAmountCardProps {
    /** Label for the card (e.g., "Add Collateral Amount") */
    label: string;
    /** The amount to display */
    amount: number;
    /** Token symbol (e.g., "XAUT", "WBTC") */
    tokenSymbol: string;
    /** Optional USD value for dual display */
    usdValue?: number;
    /** Visual variant affecting colors and effects */
    variant: "success" | "warning" | "neutral";
    /** Whether to show the token icon (default: true) */
    showIcon?: boolean;
    /** Display mode: token shows amount, usd shows USD, both shows USD as main with token below */
    displayMode?: "token" | "usd" | "both";
}

/**
 * ConfirmationAmountCard - Styled card for displaying transaction amounts with glass effects
 *
 * Features:
 * - Three variants with distinct color schemes and hover glow effects
 * - Three display modes for flexible amount presentation
 * - Glass morphism styling with backdrop blur
 * - Optional token icon display
 */
export default function ConfirmationAmountCard({
    label,
    amount,
    tokenSymbol,
    usdValue,
    variant,
    showIcon = true,
    displayMode = "token",
}: ConfirmationAmountCardProps) {
    // Variant-specific styling
    const variantClasses = {
        success: "bg-emerald-900/10 border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        warning: "bg-amber-500/10 border-amber-500/20 hover:shadow-[0_0_20px_rgba(255,160,45,0.3)]",
        neutral: "bg-white/5 border-white/10",
    };

    // Render amount based on display mode
    const renderAmount = () => {
        switch (displayMode) {
            case "usd":
                return (
                    <div className="text-center">
                        <span className="text-3xl font-bold text-white">
                            {formatCurrency(usdValue ?? 0)}
                        </span>
                    </div>
                );
            case "both":
                return (
                    <div className="text-center">
                        <span className="text-3xl font-bold text-white">
                            {formatCurrency(usdValue ?? 0)}
                        </span>
                        <p className="text-white/60 text-sm mt-1">
                            {formatAmount(amount, 4)} {tokenSymbol}
                        </p>
                    </div>
                );
            case "token":
            default:
                return (
                    <div className="text-center">
                        <span className="text-3xl font-bold text-white">
                            {formatAmount(amount, 4)}
                        </span>
                        <span className="text-xl text-white/80 ml-2">{tokenSymbol}</span>
                    </div>
                );
        }
    };

    return (
        <div
            className={cn(
                // Common styling
                "backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300",
                // Variant-specific styling
                variantClasses[variant]
            )}
        >
            {/* Label */}
            <p className="text-white/60 text-sm mb-3">{label}</p>

            {/* Content with optional icon */}
            <div className="flex items-center justify-center gap-4">
                {showIcon && (
                    <TokenIcon symbol={tokenSymbol} width={48} height={48} />
                )}
                {renderAmount()}
            </div>
        </div>
    );
}
