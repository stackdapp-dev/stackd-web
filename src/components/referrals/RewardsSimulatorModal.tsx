"use client";

import { useState, useMemo } from "react";
import { X, TrendingUp, Users, DollarSign, Calendar, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    calculateRewardsSimulation,
    formatSimulatorCurrency,
} from "@/lib/referrals/rewardsSimulator";

interface RewardsSimulatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RewardsSimulatorModal({
    isOpen,
    onClose,
}: RewardsSimulatorModalProps) {
    const router = useRouter();

    // Input states
    const [directReferrals, setDirectReferrals] = useState(10);
    const [avgReferralsPerFriend, setAvgReferralsPerFriend] = useState(5);
    const [avgLoanPosition, setAvgLoanPosition] = useState(5000);
    const [timePeriodMonths, setTimePeriodMonths] = useState(6);

    // Calculate results
    const result = useMemo(() => {
        return calculateRewardsSimulation({
            directReferrals,
            avgReferralsPerFriend,
            avgLoanPosition,
            timePeriodMonths,
        });
    }, [directReferrals, avgReferralsPerFriend, avgLoanPosition, timePeriodMonths]);

    const handleStartEarning = () => {
        onClose();
        // Navigate to wallet with openLoan param to auto-trigger New Loan modal
        router.push("/wallet?openLoan=true");
    };

    const handleShareYearlyPotential = async () => {
        const yearlyResult = calculateRewardsSimulation({
            directReferrals,
            avgReferralsPerFriend,
            avgLoanPosition,
            timePeriodMonths: 12,
        });

        const shareText = `Check out Stack'd! With ${result.totalNetwork} referrals, I could earn ${formatSimulatorCurrency(yearlyResult.estimatedEarnings)} per year in passive income. Join me: `;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Stack'd Rewards Potential",
                    text: shareText,
                    url: window.location.origin,
                });
            } catch {
                // User cancelled or error
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText + window.location.origin);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="simulator-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-neutral-900 rounded-2xl p-6 animate-fade-in max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 id="simulator-title" className="text-white text-xl font-semibold">
                            Rewards Simulator
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Input: Direct Referrals */}
                <div className="mb-4">
                    <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
                        <Users className="w-4 h-4" />
                        Your Direct Referrals
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={directReferrals}
                        onChange={(e) => setDirectReferrals(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-emerald-500/50"
                        aria-label="Direct Referrals"
                    />
                    <p className="text-white/40 text-xs mt-1">People you directly invite</p>
                </div>

                {/* Input: Avg Referrals per Friend */}
                <div className="mb-4">
                    <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
                        <Users className="w-4 h-4" />
                        Avg Referrals per Friend
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={avgReferralsPerFriend}
                        onChange={(e) => setAvgReferralsPerFriend(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-emerald-500/50"
                        aria-label="Avg Referrals per Friend"
                    />
                    <p className="text-white/40 text-xs mt-1">Average people your friends will invite</p>
                </div>

                {/* Input: Avg Loan Position */}
                <div className="mb-4">
                    <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
                        <DollarSign className="w-4 h-4" />
                        Avg Loan Position (USDT)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="100"
                        value={avgLoanPosition}
                        onChange={(e) => setAvgLoanPosition(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-emerald-500/50"
                        aria-label="Avg Loan Position"
                    />
                    <p className="text-white/40 text-xs mt-1">Average loan size per referral</p>
                </div>

                {/* Input: Time Period Slider */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
                        <Calendar className="w-4 h-4" />
                        Time Period: {timePeriodMonths} Months
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        value={timePeriodMonths}
                        onChange={(e) => setTimePeriodMonths(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        aria-label="Time Period"
                    />
                    <div className="flex justify-between text-white/40 text-xs mt-1">
                        <span>0 mo</span>
                        <span>12 mo</span>
                    </div>
                </div>

                {/* Output: Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-white/40 text-xs mb-1">Total Network</p>
                        <p className="text-white text-2xl font-medium">{result.totalNetwork}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-white/40 text-xs mb-1">Per Month</p>
                        <p className="text-emerald-400 text-2xl font-medium">
                            {formatSimulatorCurrency(result.perMonth)}
                        </p>
                    </div>
                </div>

                {/* Output: Estimated Earnings */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-5 mb-4">
                    <p className="text-white/60 text-sm mb-1">Estimated Earnings</p>
                    <p className="text-emerald-400 text-4xl font-medium mb-2">
                        {formatSimulatorCurrency(result.estimatedEarnings)}
                    </p>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                        <TrendingUp className="w-4 h-4" />
                        Over {timePeriodMonths} months
                    </div>
                </div>

                {/* Output: Breakdown */}
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-white/70">
                        <span>Direct Referrals ({directReferrals})</span>
                        <span>{formatSimulatorCurrency(result.l1Earnings)}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                        <span>2nd Level ({directReferrals * avgReferralsPerFriend})</span>
                        <span>{formatSimulatorCurrency(result.l2Earnings)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <Button
                    onClick={handleStartEarning}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-4 text-lg font-medium rounded-xl mb-3"
                >
                    Start Earning Now
                </Button>

                <button
                    onClick={handleShareYearlyPotential}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    Share Yearly Potential
                </button>

                {/* Disclaimer */}
                <p className="text-white/30 text-xs text-center mt-4">
                    *Earnings are estimates based on current rates and average positions. Actual earnings may vary.
                </p>
            </div>
        </div>
    );
}
