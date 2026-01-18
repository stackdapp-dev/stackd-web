"use client";

/**
 * AddToWalletButton Component
 * Add card to Apple Wallet or Google Pay
 */
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface AddToWalletButtonProps {
    onAddToWallet?: () => void;
    className?: string;
}

export function AddToWalletButton({ onAddToWallet, className }: AddToWalletButtonProps) {
    // Simple platform detection
    const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const walletName = isIOS ? "Apple Wallet" : "Google Pay";

    return (
        <button
            onClick={onAddToWallet}
            className={cn(
                "w-full py-4 px-6 rounded-xl",
                "bg-gray-800/50 hover:bg-gray-700/50",
                "border border-gray-700/50",
                "flex items-center justify-center gap-3",
                "text-white font-medium",
                "transition-all",
                className
            )}
        >
            <Wallet className="w-5 h-5" />
            Add to {walletName}
        </button>
    );
}

export default AddToWalletButton;
