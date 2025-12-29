"use client";

import { useEffect } from "react";

/**
 * Safari Toolbar Hide Component
 *
 * Programmatically hides Safari's toolbar on iOS (similar to "Hide Toolbar" menu option)
 * by triggering minimal UI mode through strategic scrolling.
 * This provides maximum screen space for the app's bottom navbar.
 *
 * Note: Only runs in browser mode on iOS Safari (not in PWA standalone mode).
 */
export function SafariURLBarCollapse() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // Detect Safari (not Chrome, Firefox, etc.)
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

        // Check if NOT in standalone PWA mode
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);

        // Only proceed on iOS Safari in browser mode
        if (!isIOS || !isSafari || isStandalone) return;

        /**
         * Hide Safari toolbar by entering minimal UI mode
         * This mimics the "Hide Toolbar" button behavior
         */
        const hideToolbar = () => {
            // Ensure body is scrollable (Safari requires scrollable content for minimal UI)
            const originalMinHeight = document.body.style.minHeight;
            document.body.style.minHeight = `calc(100vh + 1px)`;

            // Small delay to ensure body height change is applied
            requestAnimationFrame(() => {
                // Scroll down to trigger Safari minimal UI
                // This hides both top and bottom toolbars
                window.scrollTo({
                    top: 1,
                    behavior: 'smooth'
                });

                // After toolbar animation completes, scroll back to top
                // but keep the minimal UI state
                setTimeout(() => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                    // Restore original min-height after animations
                    setTimeout(() => {
                        document.body.style.minHeight = originalMinHeight;
                    }, 300);
                }, 300);
            });
        };

        // Initial hide on page load
        const loadTimeout = setTimeout(hideToolbar, 150);

        // Re-hide when returning to tab
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                hideToolbar();
            }
        };

        // Re-hide on orientation change
        const handleOrientationChange = () => {
            hideToolbar();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("orientationchange", handleOrientationChange);

        // Cleanup
        return () => {
            clearTimeout(loadTimeout);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("orientationchange", handleOrientationChange);
        };
    }, []);

    return null;
}
