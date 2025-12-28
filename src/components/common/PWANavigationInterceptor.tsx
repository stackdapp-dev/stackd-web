"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global PWA Navigation Interceptor
 * 
 * iOS PWAs have a known issue where clicking links can open Safari instead
 * of navigating within the app. This component intercepts ALL click events
 * on anchor elements and forces navigation to stay within the PWA.
 * 
 * This is a document-level handler that catches clicks that bubble up,
 * ensuring even dynamically created links are handled correctly.
 */
export function PWANavigationInterceptor() {
    const router = useRouter();

    useEffect(() => {
        // Only run in PWA standalone mode on iOS
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // If not in standalone PWA mode, don't intercept
        if (!isStandalone) return;

        const handleClick = (e: MouseEvent) => {
            // Find the clicked anchor element (might be a child of the anchor)
            const target = (e.target as HTMLElement).closest("a");

            if (!target) return;

            const href = target.getAttribute("href");

            // Skip if no href, external link, or special protocols
            if (!href) return;
            if (href.startsWith("http://") || href.startsWith("https://")) {
                // Check if it's an external domain
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) {
                    // External link - let it open normally (will open Safari)
                    return;
                }
            }
            if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
                return;
            }
            if (target.getAttribute("target") === "_blank") {
                return;
            }

            // This is an internal link - intercept it
            e.preventDefault();
            e.stopPropagation();

            // Navigate using Next.js router to stay within PWA
            const pathname = href.startsWith("/") ? href : `/${href}`;
            router.push(pathname);
        };

        // Add listener to document to catch all clicks
        document.addEventListener("click", handleClick, true);

        return () => {
            document.removeEventListener("click", handleClick, true);
        };
    }, [router]);

    return null;
}
