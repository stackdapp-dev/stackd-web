"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * A dismissible banner that prompts users to install the PWA.
 * Appears on first visit for non-installed users.
 */
export function InstallBanner() {
    const { canInstall, promptInstall, dismiss, isPrompting } = useInstallPrompt();
    const haptic = useHapticFeedback();

    if (!canInstall) return null;

    const handleInstall = async () => {
        haptic.light();
        const installed = await promptInstall();
        if (installed) {
            haptic.success();
        }
    };

    const handleDismiss = () => {
        haptic.light();
        dismiss();
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 pt-[calc(env(safe-area-inset-top)+16px)]">
            <div className="glass-accent mx-auto max-w-sm flex items-center gap-3 p-4">
                {/* App Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffa02d] to-[#ff7a00] flex items-center justify-center">
                    <span className="text-2xl font-bold text-black">S</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                        Add Stack&apos;d to Home Screen
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        Get the full app experience
                    </p>
                </div>

                {/* Install Button */}
                <button
                    onClick={handleInstall}
                    disabled={isPrompting}
                    className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-xl touch-active disabled:opacity-50"
                >
                    {isPrompting ? "..." : "Install"}
                </button>

                {/* Dismiss Button */}
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Dismiss"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
