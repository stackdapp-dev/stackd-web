"use client";

/**
 * VisaCard Component
 * Premium virtual Visa card visual
 */
import { cn } from "@/lib/utils";
import { maskCardNumber } from "@/lib/card/cardUtils";
import type { CardDetails } from "@/types/card";

interface VisaCardProps {
    card: CardDetails;
    showComingSoon?: boolean;
    isRevealed?: boolean;
    onReveal?: () => void;
    className?: string;
}

export function VisaCard({
    card,
    showComingSoon = false,
    isRevealed = false,
    onReveal,
    className,
}: VisaCardProps) {
    const displayNumber = isRevealed && card.fullNumber
        ? card.fullNumber.replace(/(.{4})/g, "$1 ").trim()
        : maskCardNumber(card.lastFour);

    return (
        <div className="relative">
            {/* Coming Soon Badge */}
            {showComingSoon && (
                <div className="absolute -top-2 left-0 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                        Coming Soon
                    </span>
                </div>
            )}

            {/* Card Container */}
            <div
                data-testid="visa-card"
                className={cn(
                    "relative w-full aspect-[1.76/1] rounded-2xl p-6",
                    "bg-gradient-to-br from-gray-800 via-gray-900 to-black",
                    "border border-gray-700/50 shadow-2xl",
                    "overflow-hidden",
                    card.isLocked && "opacity-60",
                    className
                )}
            >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                {/* Locked Indicator */}
                {card.isLocked && (
                    <div
                        data-testid="card-locked-indicator"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"
                    >
                        <div className="bg-red-500/20 rounded-full p-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* STACK'D Logo */}
                <div data-testid="stackd-card-logo" className="flex items-center gap-2 mb-6">
                    <div className="flex flex-col gap-0.5">
                        <div className="w-4 h-0.5 bg-gradient-to-r from-orange-400 to-orange-500" />
                        <div className="w-3 h-0.5 bg-gradient-to-r from-orange-400 to-orange-500" />
                        <div className="w-4 h-0.5 bg-gradient-to-r from-orange-400 to-orange-500" />
                    </div>
                    <span className="text-white font-bold text-lg tracking-wide">STACK&apos;D</span>
                </div>

                {/* EMV Chip */}
                <div
                    data-testid="emv-chip"
                    className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 mb-8"
                    style={{
                        backgroundImage: `
                            linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%),
                            repeating-linear-gradient(
                                90deg,
                                transparent,
                                transparent 3px,
                                rgba(0,0,0,0.1) 3px,
                                rgba(0,0,0,0.1) 4px
                            )
                        `,
                    }}
                >
                    <div className="w-full h-full grid grid-cols-3 gap-px p-1">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-yellow-600/30 rounded-sm" />
                        ))}
                    </div>
                </div>

                {/* Card Number - Lower left corner */}
                <div className="absolute bottom-6 left-6 flex items-center gap-2">
                    <span className="text-white/60 text-xs tracking-[0.2em] font-mono">
                        {displayNumber}
                    </span>
                    {onReveal && !isRevealed && (
                        <button
                            onClick={onReveal}
                            className="text-xs text-orange-400 hover:text-orange-300"
                            aria-label="Show card details"
                        >
                            Show
                        </button>
                    )}
                </div>

                {/* VISA Logo */}
                <div
                    data-testid="visa-logo"
                    className="absolute bottom-6 right-6"
                >
                    <span className="text-white text-3xl font-bold italic tracking-tight">
                        VISA
                    </span>
                </div>
            </div>
        </div>
    );
}

export default VisaCard;
