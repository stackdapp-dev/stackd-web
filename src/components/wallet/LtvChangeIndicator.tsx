"use client";

import { ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LtvChangeIndicatorProps {
    currentLtv: number;
    newLtv: number;
    maxLtv?: number;
}

/**
 * LtvChangeIndicator - Displays LTV changes with color-coded indicators
 *
 * Shows the transition from current LTV to new LTV with visual indicators:
 * - Arrow icon between values
 * - Color-coded new LTV based on improvement/worsening
 * - Warning icon when approaching max LTV (> 90% of maxLtv)
 */
export default function LtvChangeIndicator({
    currentLtv,
    newLtv,
    maxLtv,
}: LtvChangeIndicatorProps) {
    // Format LTV to 1 decimal place
    const formatLtv = (value: number): string => {
        return `${value.toFixed(1)}%`;
    };

    // Determine the color class for the new LTV value
    const getNewLtvColorClass = (): string => {
        if (newLtv < currentLtv) {
            // Improvement - risk reducing
            return "text-emerald-400";
        } else if (newLtv > currentLtv) {
            // Worsening - risk increasing
            return "text-amber-400";
        }
        // No change
        return "text-white/70";
    };

    // Check if warning should be shown (newLtv > 90% of maxLtv)
    const showWarning = maxLtv !== undefined && newLtv > maxLtv * 0.9;

    return (
        <div className={cn("flex items-center gap-1")}>
            {/* Current LTV - always neutral */}
            <span className="text-white/60">{formatLtv(currentLtv)}</span>

            {/* Arrow icon */}
            <ArrowRight className="w-4 h-4 text-white/40" />

            {/* New LTV - colored based on direction */}
            <span className={getNewLtvColorClass()}>{formatLtv(newLtv)}</span>

            {/* Warning icon when approaching max LTV */}
            {showWarning && (
                <span className="text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                </span>
            )}
        </div>
    );
}
