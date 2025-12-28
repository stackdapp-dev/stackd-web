import { useState, useEffect, useCallback } from "react";
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
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/referrals");
            if (!res.ok) throw new Error("Failed to fetch referral data");

            const data = await res.json();
            const { referral_code, ...restStats } = data;

            setReferralCode(referral_code);
            setStats(restStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const createCode = async () => {
        try {
            const res = await fetch("/api/referrals", { method: "POST" });
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
