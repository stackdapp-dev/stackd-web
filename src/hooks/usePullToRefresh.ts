"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    maxPull?: number;
}

interface PullToRefreshReturn {
    pullDistance: number;
    isPulling: boolean;
    isRefreshing: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom pull-to-refresh hook for native-like refresh behavior.
 * 
 * @param options Configuration options
 * @param options.onRefresh Async callback to execute on refresh
 * @param options.threshold Distance in pixels to trigger refresh (default: 80)
 * @param options.maxPull Maximum pull distance in pixels (default: 120)
 */
export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    maxPull = 120,
}: PullToRefreshOptions): PullToRefreshReturn {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Only enable pull-to-refresh when scrolled to top
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, []);

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isPulling || isRefreshing) return;

            currentY.current = e.touches[0].clientY;
            const diff = currentY.current - startY.current;

            // Only apply when pulling down
            if (diff > 0 && window.scrollY === 0) {
                // Apply resistance to the pull (diminishing returns)
                const resistance = 0.5;
                const distance = Math.min(diff * resistance, maxPull);
                setPullDistance(distance);

                // Prevent default scroll when pulling
                if (distance > 0) {
                    e.preventDefault();
                }
            }
        },
        [isPulling, isRefreshing, maxPull]
    );

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return;

        setIsPulling(false);

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold); // Hold at threshold during refresh

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return {
        pullDistance,
        isPulling,
        isRefreshing,
        containerRef,
    };
}
