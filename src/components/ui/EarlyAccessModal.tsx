"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

const STORAGE_KEY = "stackd_early_access_shown";

/**
 * EarlyAccessModal - One-time notification shown on first app load
 * Uses localStorage to track if the modal has been dismissed
 */
export default function EarlyAccessModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if already shown
        if (typeof window !== "undefined") {
            const hasBeenShown = localStorage.getItem(STORAGE_KEY);
            if (!hasBeenShown) {
                setIsOpen(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        // Mark as shown and close
        localStorage.setItem(STORAGE_KEY, "true");
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
            <div
                className="relative text-white rounded-3xl p-8 max-w-md w-full border border-white/10"
                style={{
                    background: 'rgba(30, 30, 30, 0.8)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                }}
            >
                {/* Close button */}
                <button
                    aria-label="Close"
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex flex-col gap-4">
                    {/* Title with orange dot */}
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <h2 className="text-xl font-semibold text-white">
                            Early Access Campaign
                        </h2>
                    </div>

                    {/* Description */}
                    <p className="text-white/70 leading-relaxed">
                        Stack&apos;d is in Beta testing before our full launch. Please report
                        any bugs via the Menu → Contact Us page or by clicking the ?
                        button at the lower right of your screen.
                    </p>

                    {/* Action button */}
                    <Button
                        onClick={handleDismiss}
                        className="w-full mt-2"
                    >
                        Got it!
                    </Button>
                </div>
            </div>
        </div>
    );
}
