/**
 * @vitest-environment jsdom
 */
/**
 * TDD Tests for useMediaQuery Hook
 *
 * This hook detects viewport breakpoints for responsive layouts.
 * Returns boolean indicating if the media query matches.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

describe("useMediaQuery", () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;
    let listeners: Map<string, Set<(e: MediaQueryListEvent) => void>>;

    beforeEach(() => {
        listeners = new Map();

        matchMediaMock = vi.fn((query: string) => {
            const listenerSet = new Set<(e: MediaQueryListEvent) => void>();
            listeners.set(query, listenerSet);

            return {
                matches: false,
                media: query,
                onchange: null,
                addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
                    if (event === "change") {
                        listenerSet.add(listener);
                    }
                }),
                removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
                    if (event === "change") {
                        listenerSet.delete(listener);
                    }
                }),
                dispatchEvent: vi.fn(),
            };
        });

        window.matchMedia = matchMediaMock as typeof window.matchMedia;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial State", () => {
        it("should return false when media query does not match", () => {
            matchMediaMock.mockImplementation((query: string) => ({
                matches: false,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

            expect(result.current).toBe(false);
        });

        it("should return true when media query matches", () => {
            matchMediaMock.mockImplementation((query: string) => ({
                matches: true,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

            expect(result.current).toBe(true);
        });
    });

    describe("Desktop Detection", () => {
        it("should detect desktop viewport with min-width query", () => {
            matchMediaMock.mockImplementation((query: string) => ({
                matches: query === "(min-width: 768px)",
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

            expect(result.current).toBe(true);
        });

        it("should return false for mobile viewport", () => {
            matchMediaMock.mockImplementation((query: string) => ({
                matches: false, // Mobile viewport
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

            expect(result.current).toBe(false);
        });
    });

    describe("Dynamic Updates", () => {
        it("should update when media query changes", () => {
            let currentMatches = false;
            const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

            matchMediaMock.mockImplementation((query: string) => ({
                matches: currentMatches,
                media: query,
                addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
                    if (event === "change") {
                        changeListeners.push(listener);
                    }
                }),
                removeEventListener: vi.fn(),
            }));

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

            expect(result.current).toBe(false);

            // Simulate viewport resize to desktop
            act(() => {
                currentMatches = true;
                changeListeners.forEach(listener => {
                    listener({ matches: true } as MediaQueryListEvent);
                });
            });

            expect(result.current).toBe(true);
        });

        it("should cleanup listeners on unmount", () => {
            const removeEventListenerMock = vi.fn();

            matchMediaMock.mockImplementation((query: string) => ({
                matches: false,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: removeEventListenerMock,
            }));

            const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));

            unmount();

            expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
        });
    });

    describe("SSR Compatibility", () => {
        it("should handle server-side rendering gracefully", () => {
            // Simulate SSR by temporarily removing matchMedia
            const originalMatchMedia = window.matchMedia;
            // @ts-ignore - intentionally testing undefined case
            delete window.matchMedia;

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

            // Should default to false on server
            expect(result.current).toBe(false);

            // Restore
            window.matchMedia = originalMatchMedia;
        });
    });
});
