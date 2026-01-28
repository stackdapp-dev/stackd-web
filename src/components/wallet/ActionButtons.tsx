"use client";

import { ArrowRightLeft, Send, Calculator, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoanSimulator from "@/components/wallet/LoanSimulator";
import NewLoanModal from "@/components/wallet/NewLoanModal";
import { Badge } from "@/components/ui/badge";

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    showBetaBadge?: boolean;
}

function ActionButton({ icon, label, onClick, disabled, showBetaBadge }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
        >
            <div className="relative">
                {showBetaBadge && (
                    <Badge
                        variant="beta"
                        showDot
                        dotColor="#f59e0b"
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 py-0.5 px-2 text-[10px] z-10"
                    >
                        ALPHA
                    </Badge>
                )}
                <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${disabled
                        ? "bg-white/5 border border-white/10"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                >
                    {icon}
                </div>
            </div>
            <span className="text-white text-sm font-medium">{label}</span>
        </button>
    );
}

export default function ActionButtons() {
    const router = useRouter();
    const [showSimulator, setShowSimulator] = useState(false);
    const [showNewLoanModal, setShowNewLoanModal] = useState(false);

    return (
        <div className="px-4">
            <div className="flex justify-center gap-6 py-4">
                <ActionButton
                    icon={<Send className="w-6 h-6 text-purple-400" />}
                    label="Send"
                    onClick={() => router.push("/wallet/send")}
                />
                <ActionButton
                    icon={<ArrowRightLeft className="w-6 h-6 text-blue-400" />}
                    label="Convert"
                    onClick={() => router.push("/wallet/convert")}
                    showBetaBadge={true}
                />
                <ActionButton
                    icon={<Calculator className="w-6 h-6 text-emerald-400" />}
                    label="Simulate"
                    onClick={() => setShowSimulator(true)}
                />
                <ActionButton
                    icon={<Plus className="w-6 h-6 text-emerald-400" />}
                    label="New Loan"
                    onClick={() => setShowNewLoanModal(true)}
                />
            </div>

            {/* Simulator Slide-up Modal */}
            {showSimulator && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 transition-opacity"
                        onClick={() => setShowSimulator(false)}
                    />
                    {/* Modal Content */}
                    <div className="relative w-full max-w-xl bg-slate-900 rounded-t-3xl p-6 pb-safe animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
                        {/* Handle bar */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white text-xl font-semibold">Loan Simulator</h2>
                            <button
                                onClick={() => setShowSimulator(false)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Simulator Content */}
                        <LoanSimulator mode="simulate" onComplete={() => setShowSimulator(false)} />
                    </div>
                </div>
            )}

            {/* New Loan Modal */}
            <NewLoanModal
                isOpen={showNewLoanModal}
                onClose={() => setShowNewLoanModal(false)}
            />
        </div>
    );
}
