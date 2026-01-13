"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if a media query matches the current viewport.
 * Useful for responsive layouts that need JavaScript-side detection.
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        // Check if matchMedia is available (SSR safety)
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const mediaQueryList = window.matchMedia(query);

        // Set initial value
        setMatches(mediaQueryList.matches);

        // Handler for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Listen for changes
        mediaQueryList.addEventListener("change", handleChange);

        // Cleanup
        return () => {
            mediaQueryList.removeEventListener("change", handleChange);
        };
    }, [query]);

    return matches;
}
