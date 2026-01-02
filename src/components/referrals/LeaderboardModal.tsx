"use client";

import { useState } from "react";
import { Trophy, Users, TrendingUp } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardEntry, anonymizeAddress } from "@/lib/referrals/leaderboard";
import { cn, formatCurrency } from "@/lib/utils";

interface LeaderboardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function LeaderboardEntryRow({ entry, showDeposits }: { entry: LeaderboardEntry; showDeposits?: boolean }) {
    const isTopThree = entry.rank <= 3;

    return (
        <GlassCard
            data-testid={`leaderboard-entry-${entry.rank}`}
            className={cn(
                "p-4 flex items-center justify-between",
                entry.isCurrentUser && "border-[#ffa02d] border-2 bg-[#ffa02d]/10"
            )}
        >
            <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div
                    data-testid={`leaderboard-rank-${entry.rank}`}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm",
                        isTopThree
                            ? "bg-[#ffa02d]/20 text-[#ffa02d]"
                            : "bg-white/10 text-white/60"
                    )}
                >
                    {entry.rank}
                </div>

                {/* Wallet Address */}
                <div>
                    <p className={cn(
                        "text-sm font-medium",
                        entry.isCurrentUser ? "text-[#ffa02d]" : "text-white"
                    )}>
                        {anonymizeAddress(entry.walletAddress)}
                        {entry.isCurrentUser && (
                            <span className="ml-2 text-xs text-[#ffa02d]/60">(You)</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="text-right">
                {showDeposits ? (
                    <p className="text-white font-medium">
                        {formatCurrency(entry.totalDeposits)}
                    </p>
                ) : (
                    <p className="text-white font-medium">
                        {entry.referralCount}
                        <span className="text-white/40 text-xs ml-1">referrals</span>
                    </p>
                )}
            </div>
        </GlassCard>
    );
}

function LoadingState() {
    return (
        <div data-testid="leaderboard-loading" className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 skeleton-shimmer" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-white/10 rounded skeleton-shimmer" />
                        </div>
                        <div className="h-4 w-16 bg-white/10 rounded skeleton-shimmer" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <GlassCard className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white/40" />
            </div>
            <p className="text-white/60">No referrers yet</p>
            <p className="text-white/40 text-sm mt-1">Be the first to climb the ranks!</p>
        </GlassCard>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <GlassCard className="p-8 text-center">
            <p className="text-rose-400">{message}</p>
        </GlassCard>
    );
}

export function LeaderboardModal({ open, onOpenChange }: LeaderboardModalProps) {
    const { topReferrers, topByDeposits, userRank, loading, error } = useLeaderboard();
    const [activeTab, setActiveTab] = useState("referrers");

    const currentRank = activeTab === "referrers" ? userRank?.byReferrals : userRank?.byDeposits;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ffa02d]/20 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-[#ffa02d]" />
                        </div>
                        <div>
                            <DrawerTitle className="text-white">Leaderboard</DrawerTitle>
                            <DrawerDescription>Top community members</DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="px-4 pb-6 overflow-y-auto scrollbar-hide">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full mb-4 bg-white/5 border border-white/10">
                            <TabsTrigger
                                value="referrers"
                                className="flex-1 data-[state=active]:bg-[#ffa02d] data-[state=active]:text-black"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Top Referrers
                            </TabsTrigger>
                            <TabsTrigger
                                value="deposits"
                                className="flex-1 data-[state=active]:bg-[#ffa02d] data-[state=active]:text-black"
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Top Deposits
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="referrers" className="mt-0">
                            {loading ? (
                                <LoadingState />
                            ) : error ? (
                                <ErrorState message={error} />
                            ) : topReferrers.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="space-y-2">
                                    {topReferrers.map((entry) => (
                                        <LeaderboardEntryRow
                                            key={entry.walletAddress}
                                            entry={entry}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="deposits" className="mt-0">
                            {loading ? (
                                <LoadingState />
                            ) : error ? (
                                <ErrorState message={error} />
                            ) : topByDeposits.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="space-y-2">
                                    {topByDeposits.map((entry) => (
                                        <LeaderboardEntryRow
                                            key={entry.walletAddress}
                                            entry={entry}
                                            showDeposits
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* User's Rank Footer */}
                    {userRank && currentRank && (
                        <GlassCard
                            variant="accent"
                            className="mt-4 p-4 flex items-center justify-between"
                            data-testid="user-rank"
                        >
                            <span className="text-white/60 text-sm">Your Rank</span>
                            <span className="text-[#ffa02d] font-medium">Your Rank: #{currentRank}</span>
                        </GlassCard>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
