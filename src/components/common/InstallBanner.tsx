"use client";

import { useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * A dismissible banner that prompts users to install the PWA.
 * Shows native install for Android/Chrome, or manual instructions for iOS.
 */
export function InstallBanner() {
    const { canInstall, promptInstall, dismiss, isPrompting, showIOSInstall } = useInstallPrompt();
    const haptic = useHapticFeedback();
    const [showIOSModal, setShowIOSModal] = useState(false);

    if (!canInstall) return null;

    const handleInstall = async () => {
        haptic.light();
        if (showIOSInstall) {
            setShowIOSModal(true);
        } else {
            const installed = await promptInstall();
            if (installed) {
                haptic.success();
            }
        }
    };

    const handleDismiss = () => {
        haptic.light();
        dismiss();
    };

    const handleCloseModal = () => {
        haptic.light();
        setShowIOSModal(false);
    };

    return (
        <>
            {/* Banner */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 pt-[calc(env(safe-area-inset-top)+16px)]">
                <div className="glass-accent mx-auto max-w-sm flex items-center gap-3 p-4">
                    {/* App Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden">
                        <img
                            src="/logo.png"
                            alt="ArCa"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                            Add ArCa to Home Screen
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
                        {isPrompting ? "..." : showIOSInstall ? "How?" : "Install"}
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

            {/* iOS Instructions Modal */}
            {showIOSModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onClick={handleCloseModal}
                >
                    <div
                        className="w-full max-w-md mx-4 mb-8 p-6 rounded-3xl bg-[#1a1a2e] border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add to Home Screen</h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-white/60 hover:text-white"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-5">
                            {/* Step 1 */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <span className="text-amber-400 font-bold">1</span>
                                </div>
                                <div className="flex-1 pt-2">
                                    <p className="text-white font-medium mb-1">Tap the Share button</p>
                                    <p className="text-white/60 text-sm">
                                        Look for the{" "}
                                        <span className="inline-flex items-center px-2 py-0.5 bg-white/10 rounded text-white text-xs">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Share
                                        </span>
                                        {" "}icon at the bottom of Safari
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <span className="text-amber-400 font-bold">2</span>
                                </div>
                                <div className="flex-1 pt-2">
                                    <p className="text-white font-medium mb-1">Scroll and tap &quot;Add to Home Screen&quot;</p>
                                    <p className="text-white/60 text-sm">
                                        Find{" "}
                                        <span className="inline-flex items-center px-2 py-0.5 bg-white/10 rounded text-white text-xs">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add to Home Screen
                                        </span>
                                        {" "}in the share menu
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <span className="text-emerald-400 font-bold">3</span>
                                </div>
                                <div className="flex-1 pt-2">
                                    <p className="text-white font-medium mb-1">Tap &quot;Add&quot;</p>
                                    <p className="text-white/60 text-sm">
                                        Confirm by tapping Add in the top-right corner
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Done Button */}
                        <button
                            onClick={handleCloseModal}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-[#ffa02d] to-[#ff8c00] text-black font-medium rounded-xl"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

