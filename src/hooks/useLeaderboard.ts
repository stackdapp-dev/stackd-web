import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
    LeaderboardEntry,
    UserRank,
} from "@/lib/referrals/leaderboard";

interface UseLeaderboardResult {
    topReferrers: LeaderboardEntry[];
    topByDeposits: LeaderboardEntry[];
    userRank: UserRank | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardResult {
    const { user, getAccessToken } = usePrivy();
    const [topReferrers, setTopReferrers] = useState<LeaderboardEntry[]>([]);
    const [topByDeposits, setTopByDeposits] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<UserRank | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get auth token if user is logged in
            const token = user ? await getAccessToken() : null;

            const res = await fetch("/api/referrals/leaderboard", {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!res.ok) {
                throw new Error("Failed to fetch leaderboard");
            }

            const data = await res.json();

            setTopReferrers(data.topReferrers);
            setTopByDeposits(data.topByDeposits);
            setUserRank(data.userRank);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    }, [user, getAccessToken]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        topReferrers,
        topByDeposits,
        userRank,
        loading,
        error,
        refetch: fetchLeaderboard,
    };
}
