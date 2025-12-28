import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ReferralStats } from "@/lib/db/types";

interface UseReferralResult {
    stats: ReferralStats | null;
    referralCode: string | null;
    loading: boolean;
    error: string | null;
    createCode: () => Promise<string | null>;
    refetch: () => Promise<void>;
}

export function useReferral(): UseReferralResult {
    const { getAccessToken, authenticated } = usePrivy();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get auth token from Privy
            const token = await getAccessToken();

            const res = await fetch("/api/referrals", {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });

            if (!res.ok) throw new Error("Failed to fetch referral data");

            const data = await res.json();
            const { referral_code, unclaimed_earnings, ...restStats } = data;

            setReferralCode(referral_code);
            setStats(restStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        // Only fetch when authenticated
        if (authenticated) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [fetchStats, authenticated]);

    const createCode = async () => {
        try {
            const token = await getAccessToken();
            const res = await fetch("/api/referrals", {
                method: "POST",
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            if (!res.ok) throw new Error("Failed to create code");
            const { code } = await res.json();
            setReferralCode(code);
            return code;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    return {
        stats,
        referralCode,
        loading,
        error,
        createCode,
        refetch: fetchStats
    };
}

