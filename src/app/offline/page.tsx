"use client";

import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
            {/* Offline Icon */}
            <div className="glass p-6 rounded-full mb-6">
                <svg
                    className="w-16 h-16 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-12.728-12.728m12.728 12.728L5.636 5.636m12.728 0a9 9 0 00-12.728 0m0 12.728a9 9 0 010-12.728"
                    />
                </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
                You&apos;re Offline
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-8 max-w-xs">
                It looks like you&apos;ve lost your internet connection. Some features
                may be unavailable until you reconnect.
            </p>

            {/* Retry Button */}
            <button
                onClick={() => window.location.reload()}
                className="glass-accent px-6 py-3 font-medium text-primary hover:bg-[#ffa02d]/20 transition-colors touch-active"
            >
                Try Again
            </button>

            {/* Home Link */}
            <Link
                href="/"
                className="mt-4 text-muted-foreground hover:text-foreground transition-colors"
            >
                Return to Home
            </Link>
        </div>
    );
}
