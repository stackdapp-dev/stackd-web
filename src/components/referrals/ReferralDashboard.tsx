"use client";

import { useReferral } from "@/hooks/useReferral";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useFluid } from "@/hooks/useFluid";
import { GlassCard } from "@/components/ui/GlassCard";
import { TierProgress } from "@/components/referrals/TierProgress";
import { getUserTier } from "@/lib/referrals/tiers";
import {
    Copy, Share2, Lock, Trophy, Users,
    CreditCard, Check, Sparkles, Medal, TrendingUp
} from "lucide-react";
import { LeaderboardModal } from "@/components/referrals/LeaderboardModal";
import RewardsSimulatorModal from "@/components/referrals/RewardsSimulatorModal";
import { useState } from "react";
import { cn, shortenAddress } from "@/lib/utils";
import { UserTier, RecentInvite } from "@/lib/db/types";
import { showSuccessToast, showInfoToast } from "@/components/ui/custom-toast";

// Format wallet address as 0x12...3456
function formatWalletDisplay(invite: RecentInvite): string {
    if (invite.display_name) {
        return invite.display_name;
    }
    return shortenAddress(invite.wallet_address, 4);
}

// Tier colors
const tierStyles: Record<UserTier, { bg: string; border: string; text: string; icon: string }> = {
    BRONZE: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-400",
        icon: "text-orange-400",
    },
    SILVER: {
        bg: "bg-gray-400/10",
        border: "border-gray-400/20",
        text: "text-gray-300",
        icon: "text-gray-300",
    },
    GOLD: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        text: "text-yellow-400",
        icon: "text-yellow-400",
    },
    PLATINUM: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-400",
        icon: "text-purple-400",
    },
    BLACK: {
        bg: "bg-zinc-800/50",
        border: "border-zinc-700/50",
        text: "text-zinc-200",
        icon: "text-zinc-200",
    },
};

export function ReferralDashboard() {
    const { stats, referralCode, loading, createCode } = useReferral();
    const { loanCalcs } = useLoanCalculationsContext();
    const { borrowedAssets: fluidBorrowedAssets } = useFluid();
    const [copied, setCopied] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [simulatorOpen, setSimulatorOpen] = useState(false);

    // Get personal loan balance from borrowed assets across ALL protocols (Compound + Fluid)
    const compoundLoanBalance = loanCalcs.borrowedAssets.reduce(
        (sum, asset) => sum + asset.usdValue,
        0
    );
    const fluidLoanBalance = fluidBorrowedAssets.reduce(
        (sum, asset) => sum + asset.usdValue,
        0
    );
    const personalLoanBalance = compoundLoanBalance + fluidLoanBalance;

    // Calculate tier client-side using actual loan balance (overrides server-side calculation)
    // Server calculates based on referral count, but tier should be based on loan volume
    const calculatedTier = getUserTier({
        personalLoanBalance,
        networkVolume: stats?.network_volume || 0,
    });

    const copyToClipboard = () => {
        if (!referralCode) return;
        const link = `${window.location.origin}?ref=${referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        showSuccessToast("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = async () => {
        if (!referralCode) return;
        const link = `${window.location.origin}?ref=${referralCode}`;
        if (navigator.share) {
            await navigator.share({
                title: "Join Stack'd",
                text: "Get 1% discounted borrowing with my referral!",
                url: link,
            });
        } else {
            copyToClipboard();
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {/* Skeleton for Total Earnings card */}
                <div className="rounded-2xl border border-white/10 p-6 space-y-4 bg-white/5">
                    <div className="h-4 w-24 bg-white/10 rounded skeleton-shimmer" />
                    <div className="h-10 w-48 bg-white/10 rounded skeleton-shimmer" />
                    <div className="h-4 w-32 bg-white/10 rounded skeleton-shimmer" />
                    <div className="h-12 w-full bg-white/10 rounded-xl skeleton-shimmer" />
                </div>

                {/* Skeleton for Referral Link card */}
                <div className="rounded-2xl border border-white/10 p-5 space-y-4 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 skeleton-shimmer" />
                        <div className="space-y-2">
                            <div className="h-4 w-40 bg-white/10 rounded skeleton-shimmer" />
                            <div className="h-3 w-56 bg-white/10 rounded skeleton-shimmer" />
                        </div>
                    </div>
                    <div className="h-14 w-full bg-white/10 rounded-xl skeleton-shimmer" />
                    <div className="flex gap-2">
                        <div className="flex-1 h-12 bg-white/10 rounded-2xl skeleton-shimmer" />
                        <div className="flex-1 h-12 bg-white/10 rounded-2xl skeleton-shimmer" />
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#ffa02d]/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-[#ffa02d]" />
                </div>
                <h2 className="text-2xl text-white font-medium mb-4">Start Earning Rewards</h2>
                <p className="text-white/60 mb-8 max-w-md">
                    Invite friends to Stack&apos;d and earn passive income on their loan volume.
                </p>
                <button
                    onClick={createCode}
                    className="relative bg-gradient-to-br from-[#ffa02d] to-[#ff8c00] text-black px-8 py-3 
                   rounded-full hover:shadow-[0_0_20px_rgba(255,160,45,0.5)] hover:scale-105 
                   transition-all duration-300 font-medium shadow-lg"
                >
                    Generate Referral Link
                </button>
            </div>
        );
    }

    // Use client-calculated tier based on actual loan balance
    const tierStyle = tierStyles[calculatedTier];

    // Calculate total earnings (inflation avoided + referral rewards)
    const referralRewards = stats.total_earnings;
    const totalEarnings = stats.inflation_avoided + referralRewards;

    return (
        <div className="space-y-6">
            {/* Hero Card - Total Earnings with Breakdown */}
            <GlassCard variant="dark" className="p-6 relative overflow-hidden">
                <div className="relative z-10">
                    {/* Total Earnings */}
                    <p className="text-white/60 text-sm mb-2">Total Earnings</p>
                    <h1 className="text-4xl text-white font-medium mb-6">
                        ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h1>

                    {/* Breakdown Row */}
                    <div className="flex gap-8 mb-4">
                        <div>
                            <p className="text-white/40 text-xs mb-1">Inflation Avoided</p>
                            <p className="text-white text-xl font-medium">
                                ${stats.inflation_avoided.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs mb-1">Referral Rewards</p>
                            <p className="text-white text-xl font-medium">
                                ${referralRewards.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Tier Badge */}
                    <div className="mb-5">
                        <span className={cn(
                            "text-xs px-3 py-1.5 rounded-full border",
                            tierStyle.bg, tierStyle.border, tierStyle.text
                        )}>
                            {calculatedTier.charAt(0) + calculatedTier.slice(1).toLowerCase()} Tier
                        </span>
                    </div>

                    {/* Claim Rewards Button */}
                    <button
                        onClick={() => showInfoToast('🎉 Season 1 Rewards Coming Soon!')}
                        className="w-full bg-gradient-to-r from-[#ffa02d] to-[#ff8c00] text-black py-3.5 
                                   rounded-xl hover:shadow-[0_0_20px_rgba(255,160,45,0.5)] 
                                   transition-all duration-300 font-medium"
                    >
                        Claim Rewards
                    </button>
                </div>
            </GlassCard>

            {/* Referral Link Card */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffa02d]/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#ffa02d]" />
                    </div>
                    <div>
                        <p className="text-white font-medium">Earn 20% Referral Rewards</p>
                        <p className="text-white/40 text-xs">Friends beat inflation, you earn while helping them</p>
                    </div>
                </div>

                {/* Referral Code Display */}
                {referralCode && (
                    <button
                        onClick={copyToClipboard}
                        className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10 text-center w-full 
                                   hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    >
                        <p className="text-white/50 text-xs mb-1">
                            {copied ? 'Copied!' : 'Your Referral Code (tap to copy)'}
                        </p>
                        <p className={`text-lg font-mono font-bold tracking-wider ${copied ? 'text-emerald-400' : 'text-white'}`} data-testid="referral-code">
                            {referralCode}
                        </p>
                    </button>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 text-white py-3 
                                   rounded-2xl hover:bg-white/10 transition-all duration-300 font-medium 
                                   flex items-center justify-center gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy Link
                            </>
                        )}
                    </button>
                    <button
                        onClick={shareLink}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 text-white px-4 py-3 
                                   rounded-2xl hover:bg-white/10 transition-all duration-300"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </GlassCard>

            {/* Simulate My Rewards Button */}
            <button
                onClick={() => setSimulatorOpen(true)}
                className="w-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30
                           text-white py-4 rounded-2xl hover:bg-emerald-500/30 transition-all duration-300
                           flex items-center justify-center gap-3 font-medium"
                data-testid="simulate-rewards-button"
            >
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Simulate My Rewards
            </button>

            {/* Tier Progress - Dual Progress Bars (Loan Size + Network Volume) */}
            <TierProgress
                currentTier={calculatedTier}
                personalLoanBalance={personalLoanBalance}
                networkVolume={stats.network_volume}
                totalReferrals={stats.total_invites}
            />

            {/* Locked Tiers Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Gold Status - Locked */}
                <GlassCard className="p-4 opacity-50 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                        <Lock className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
                        <Trophy className="w-5 h-5 text-yellow-500/50" />
                    </div>
                    <p className="text-white/60 font-medium text-sm">Gold Status</p>
                    <p className="text-white/30 text-xs mt-1">Priority Support</p>
                </GlassCard>

                {/* Metal Visa Card - Locked */}
                <GlassCard className="p-4 opacity-50 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                        <Lock className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                        <CreditCard className="w-5 h-5 text-purple-500/50" />
                    </div>
                    <p className="text-white/60 font-medium text-sm">Metal Visa</p>
                    <p className="text-white/30 text-xs mt-1">Exclusive Access</p>
                </GlassCard>
            </div>

            {/* Community Impact List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-white/60" />
                        Community Impact
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLeaderboardOpen(true)}
                            className="flex items-center gap-1.5 text-[#ffa02d] text-xs font-medium
                                       hover:text-[#ffa02d]/80 transition-colors"
                            data-testid="leaderboard-button"
                        >
                            <Medal className="w-4 h-4" />
                            Leaderboard
                        </button>
                        <span className="text-white/40 text-xs">{stats.total_invites} referrals</span>
                    </div>
                </div>

                {stats.recent_invites.length === 0 ? (
                    <GlassCard className="p-6 text-center">
                        <p className="text-white/40 text-sm">No invites yet. Share your link to get started!</p>
                    </GlassCard>
                ) : (
                    <div className="space-y-2">
                        {stats.recent_invites.map((invite, i) => {
                            const inviteTierStyle = tierStyles[invite.tier];
                            return (
                                <GlassCard key={i} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            inviteTierStyle.bg
                                        )}>
                                            <span className={cn("text-sm font-medium", inviteTierStyle.text)}>
                                                {formatWalletDisplay(invite).charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">
                                                {formatWalletDisplay(invite)}
                                            </p>
                                            <p className="text-white/40 text-xs">
                                                Joined {new Date(invite.joined_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {invite.status === 'pending' ? (
                                            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                                                Pending
                                            </span>
                                        ) : (
                                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                Saved +${invite.saved_monthly.toFixed(2)}/mo
                                            </span>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Stats Summary */}
            <GlassCard variant="dark" className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-white/40 text-xs mb-1">Total Earnings</p>
                        <p className="text-[#ffa02d] font-medium">
                            ${stats.total_earnings.toFixed(2)}
                        </p>
                    </div>
                    <div className="border-x border-white/10">
                        <p className="text-white/40 text-xs mb-1">Network</p>
                        <p className="text-white font-medium">{stats.network_size}</p>
                    </div>
                    <div>
                        <p className="text-white/40 text-xs mb-1">Volume</p>
                        <p className="text-white font-medium">
                            ${(stats.network_volume / 1000).toFixed(0)}k
                        </p>
                    </div>
                </div>
            </GlassCard>

            <LeaderboardModal
                open={leaderboardOpen}
                onOpenChange={setLeaderboardOpen}
            />

            {/* Rewards Simulator Modal */}
            <RewardsSimulatorModal
                isOpen={simulatorOpen}
                onClose={() => setSimulatorOpen(false)}
            />
        </div >
    );
}
