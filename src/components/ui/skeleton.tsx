"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonProps {
    className?: string;
}

/**
 * Base skeleton shimmer element
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            data-testid="skeleton"
            className={cn(
                "rounded bg-white/10 skeleton-shimmer",
                className
            )}
        />
    );
}

/**
 * Skeleton for a list row (transactions, assets, etc.)
 */
export function SkeletonRow({ className }: SkeletonProps) {
    return (
        <div className={cn("rounded-2xl border border-white/10 p-4 flex items-center gap-4", className)}>
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
            </div>
            <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
            </div>
        </div>
    );
}

/**
 * Skeleton for a card (wallet balance, etc.)
 */
export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn("rounded-2xl border border-white/10 p-6 space-y-4", className)}>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
        </div>
    );
}

/**
 * Skeleton for a button
 */
export function SkeletonButton({ className }: SkeletonProps) {
    return (
        <Skeleton className={cn("h-12 w-full rounded-2xl", className)} />
    );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ lines = 3, className }: SkeletonProps & { lines?: number }) {
    return (
        <div className={cn("space-y-2", className)}>
            {[...Array(lines)].map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

/**
 * Full page loading overlay with centered spinner
 */
export function LoadingOverlay({ message }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                {message && (
                    <p className="text-white/60 text-sm">{message}</p>
                )}
            </div>
        </div>
    );
}

/**
 * Inline loading spinner
 */
export function LoadingSpinner({ size = "default", className }: SkeletonProps & { size?: "small" | "default" | "large" }) {
    const sizeClasses = {
        small: "w-4 h-4 border",
        default: "w-6 h-6 border-2",
        large: "w-10 h-10 border-2",
    };

    return (
        <div
            className={cn(
                "border-amber-500 border-t-transparent rounded-full animate-spin",
                sizeClasses[size],
                className
            )}
        />
    );
}

export default Skeleton;
