"use client";

/**
 * BetaBadge - A pill badge indicating beta status
 * Displayed above page titles throughout the app
 */
export default function BetaBadge() {
    return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-white/90 tracking-wide">
                BETA
            </span>
        </div>
    );
}
