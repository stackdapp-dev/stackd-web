"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#ffa02d]/20 flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
                <p className="text-white/60 mb-8">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 
                                   bg-gradient-to-r from-[#ffa02d] to-[#ff8c00] 
                                   text-black font-medium rounded-xl
                                   hover:shadow-[0_0_20px_rgba(255,160,45,0.5)] 
                                   transition-all duration-300"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 
                                   border border-white/20 text-white font-medium rounded-xl
                                   hover:bg-white/10 transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
