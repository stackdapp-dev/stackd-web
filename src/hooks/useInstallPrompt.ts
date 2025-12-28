"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

interface InstallPromptReturn {
    /** Whether the app can be installed (prompt is available) */
    canInstall: boolean;
    /** Whether the app is already installed (running in standalone mode) */
    isInstalled: boolean;
    /** Whether the install prompt is currently showing */
    isPrompting: boolean;
    /** Trigger the install prompt */
    promptInstall: () => Promise<boolean>;
    /** Dismiss the install prompt for this session */
    dismiss: () => void;
    /** Whether the user has previously dismissed the prompt */
    isDismissed: boolean;
    /** Whether running on iOS Safari (requires manual install instructions) */
    isIOS: boolean;
    /** Whether we should show the iOS install modal */
    showIOSInstall: boolean;
}

const DISMISS_KEY = "stackd-install-dismissed";
const DISMISS_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Detect if running on iOS Safari
 */
function detectIOS(): boolean {
    if (typeof window === "undefined") return false;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);

    return isIOS && isSafari;
}

/**
 * Detect if running on a mobile device (excludes desktop)
 */
function detectMobile(): boolean {
    if (typeof window === "undefined") return false;

    const ua = navigator.userAgent;
    // Check for common mobile indicators
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
        ('ontouchstart' in window && navigator.maxTouchPoints > 0);

    return isMobile;
}

/**
 * Hook to capture and manage the PWA install prompt.
 * Provides methods to check install status, trigger installation,
 * and manage dismissal state.
 */
export function useInstallPrompt(): InstallPromptReturn {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isPrompting, setIsPrompting] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if running in standalone mode (already installed)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            // iOS Safari
            ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);

        setIsInstalled(isStandalone);
        setIsIOS(detectIOS());
        setIsMobile(detectMobile());

        // Check dismissal state
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const dismissTime = parseInt(dismissedAt, 10);
            if (Date.now() - dismissTime < DISMISS_EXPIRY) {
                setIsDismissed(true);
            } else {
                localStorage.removeItem(DISMISS_KEY);
            }
        }
    }, []);

    // Capture the beforeinstallprompt event
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            // Prevent Chrome's default mini-infobar
            e.preventDefault();
            setInstallPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setInstallPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!installPrompt) return false;

        setIsPrompting(true);

        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;

            if (outcome === "accepted") {
                setIsInstalled(true);
                setInstallPrompt(null);
                return true;
            }

            return false;
        } finally {
            setIsPrompting(false);
        }
    }, [installPrompt]);

    const dismiss = useCallback(() => {
        setIsDismissed(true);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    // Show install prompt for Android/Chrome only (native prompt)
    // iOS PWA has navigation issues - disabled until fixed
    // See: bugfix branch for iOS PWA investigation
    const canShowPrompt = !isInstalled && !isDismissed && isMobile;
    const hasNativePrompt = !!installPrompt;

    return {
        canInstall: canShowPrompt && hasNativePrompt, // Removed iOS - only show for native prompts
        isInstalled,
        isPrompting,
        promptInstall,
        dismiss,
        isDismissed,
        isIOS,
        showIOSInstall: false, // Disabled iOS install banner
    };
}

