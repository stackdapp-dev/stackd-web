"use client";

import { useEffect } from "react";

/**
 * Safari URL Bar Collapse Component
 *
 * On iOS Safari (non-PWA mode), the URL bar can overlap with the bottom navigation.
 * This component automatically scrolls the page slightly on load to trigger Safari
 * to hide the URL bar, providing more space for the app's bottom navbar.
 *
 * Note: This only runs in browser (non-PWA) mode on iOS Safari.
 */
export function SafariURLBarCollapse() {
    useEffect(() => {
        // Only run on client side
        if (typeof window === "undefined") return;

        // Check if we're on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // Check if we're in Safari (not Chrome, Firefox, etc.)
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

        // Check if we're NOT in standalone PWA mode
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);

        // Only proceed if we're on iOS Safari in browser mode (not PWA)
        if (!isIOS || !isSafari || isStandalone) return;

        // Function to collapse the URL bar
        const collapseURLBar = () => {
            // Scroll down slightly to trigger URL bar collapse
            // Safari hides the URL bar when user scrolls down
            window.scrollTo(0, 1);

            // After a brief delay, scroll back to top if we're at the very top
            // This maintains the collapsed state while keeping content visible
            setTimeout(() => {
                if (window.scrollY === 1) {
                    window.scrollTo(0, 0);
                }
            }, 50);
        };

        // Collapse on initial load
        // Use setTimeout to ensure DOM is fully loaded
        const initialTimeout = setTimeout(() => {
            collapseURLBar();
        }, 100);

        // Re-collapse when page becomes visible (user switches back to tab)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                collapseURLBar();
            }
        };

        // Re-collapse on window resize (orientation change)
        const handleResize = () => {
            collapseURLBar();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("resize", handleResize);

        return () => {
            clearTimeout(initialTimeout);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return null;
}
