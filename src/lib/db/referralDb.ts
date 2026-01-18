/**
 * Referral Database Service
 * 
 * Handles all database operations for the referral system.
 * Uses Supabase when configured, falls back to mock data for development.
 */

import { isSupabaseConfigured } from './supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { dbService as mockDbService } from './mock';
import type { User } from './supabase.types';
import type { ReferralStats } from './types';
import { getTotalCollateralByAddress } from '@/lib/collateral/multiProtocolCollateral';

// Create Supabase client with service role key for server-side operations (bypasses RLS)
// Only create if env vars are present (prevents CI/CD failures)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: SupabaseClient<any, "public", any> | null = null;
if (supabaseUrl && supabaseServiceKey) {
    db = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'STACK';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

class ReferralDatabaseService {
    /**
     * Get or create a user by wallet address
     */
    async getOrCreateUser(walletAddress: string): Promise<User | null> {
        if (!isSupabaseConfigured() || !db) {
            const mockUser = await mockDbService.getUser('user_123');
            return mockUser as unknown as User;
        }

        const normalizedAddress = walletAddress.toLowerCase();

        // Try to find existing user
        const { data: existingUser } = await db.from('users')
            .select('*')
            .eq('wallet_address', normalizedAddress)
            .single();

        if (existingUser) {
            return existingUser as User;
        }

        // Create new user with referral code
        const referralCode = generateReferralCode();
        const { data: newUser, error } = await db.from('users')
            .insert({
                wallet_address: normalizedAddress,
                referral_code: referralCode,
            })
            .select()
            .single();

        if (error) {
            // Handle race condition: if duplicate key error, fetch the existing user
            if (error.code === '23505') {
                const { data: raceUser } = await db.from('users')
                    .select('*')
                    .eq('wallet_address', normalizedAddress)
                    .single();
                if (raceUser) {
                    return raceUser as User;
                }
            }
            console.error('[ReferralDB] Error creating user:', error);
            return null;
        }

        return newUser as User;
    }

    /**
     * Get user by wallet address
     */
    async getUserByWallet(walletAddress: string): Promise<User | null> {
        if (!isSupabaseConfigured() || !db) {
            const mockUser = await mockDbService.getUser('user_123');
            return mockUser as unknown as User;
        }

        const { data, error } = await db.from('users')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        if (error) {
            return null;
        }

        return data as User;
    }

    /**
     * Get user by referral code
     */
    async getUserByReferralCode(code: string): Promise<User | null> {
        if (!isSupabaseConfigured() || !db) {
            return null;
        }

        const { data, error } = await db.from('users')
            .select('*')
            .eq('referral_code', code.toUpperCase())
            .single();

        if (error) {
            return null;
        }

        return data as User;
    }

    /**
     * Link a referee to a referrer via referral code
     */
    async joinReferral(refereeWallet: string, referralCode: string): Promise<boolean> {
        if (!isSupabaseConfigured() || !db) {
            return mockDbService.joinReferral('referee_999', referralCode);
        }

        const referrer = await this.getUserByReferralCode(referralCode);
        if (!referrer) {
            return false;
        }

        const referee = await this.getOrCreateUser(refereeWallet);
        if (!referee) {
            return false;
        }

        if (referee.referred_by) {
            return false;
        }

        const { error } = await db.from('users')
            .update({ referred_by: referrer.id })
            .eq('id', referee.id);

        if (error) {
            console.error('[ReferralDB] Error linking referral:', error);
            return false;
        }

        return true;
    }

    /**
     * Get referral network for a user (L1, L2, L3)
     */
    async getReferralNetwork(userId: string): Promise<{ level: 1 | 2 | 3; user: User }[]> {
        if (!isSupabaseConfigured() || !db) {
            return [];
        }

        const network: { level: 1 | 2 | 3; user: User }[] = [];

        const { data: l1Users } = await db.from('users')
            .select('*')
            .eq('referred_by', userId);

        if (l1Users) {
            for (const user of l1Users as User[]) {
                network.push({ level: 1, user });

                const { data: l2Users } = await db.from('users')
                    .select('*')
                    .eq('referred_by', user.id);

                if (l2Users) {
                    for (const l2User of l2Users as User[]) {
                        network.push({ level: 2, user: l2User });

                        const { data: l3Users } = await db.from('users')
                            .select('*')
                            .eq('referred_by', l2User.id);

                        if (l3Users) {
                            for (const l3User of l3Users as User[]) {
                                network.push({ level: 3, user: l3User });
                            }
                        }
                    }
                }
            }
        }

        return network;
    }

    /**
     * Get unclaimed earnings for a user
     */
    async getUnclaimedEarnings(userId: string): Promise<number> {
        if (!isSupabaseConfigured() || !db) {
            return 42.85;
        }

        const { data, error } = await db.from('referral_earnings')
            .select('amount')
            .eq('referrer_id', userId)
            .eq('claimed', false);

        if (error || !data) {
            return 0;
        }

        return (data as { amount: number }[]).reduce((sum, row) => sum + Number(row.amount), 0);
    }

    /**
     * Claim earnings for a user
     */
    async claimEarnings(userId: string): Promise<{ success: boolean; amount: number }> {
        if (!isSupabaseConfigured() || !db) {
            return { success: true, amount: 42.85 };
        }

        const { data: earnings, error: fetchError } = await db.from('referral_earnings')
            .select('id, amount')
            .eq('referrer_id', userId)
            .eq('claimed', false);

        if (fetchError || !earnings || earnings.length === 0) {
            return { success: false, amount: 0 };
        }

        const typedEarnings = earnings as { id: string; amount: number }[];
        const totalAmount = typedEarnings.reduce((sum, row) => sum + Number(row.amount), 0);
        const earningIds = typedEarnings.map(e => e.id);

        const { error: updateError } = await db.from('referral_earnings')
            .update({ claimed: true, claimed_at: new Date().toISOString() })
            .in('id', earningIds);

        if (updateError) {
            return { success: false, amount: 0 };
        }

        return { success: true, amount: totalAmount };
    }

    /**
     * Get referral stats (for dashboard display)
     * Fetches real data from Supabase when available
     */
    async getReferralStats(userId: string): Promise<ReferralStats> {
        // Fallback to mock if Supabase not configured
        if (!isSupabaseConfigured() || !db) {
            return mockDbService.getReferralStats(userId);
        }

        try {
            // 1. Get total referral earnings (sum of all earnings for this user)
            const { data: earningsData } = await db.from('referral_earnings')
                .select('amount')
                .eq('referrer_id', userId);

            const totalEarnings = earningsData
                ? (earningsData as { amount: number }[]).reduce((sum, row) => sum + Number(row.amount), 0)
                : 0;

            // 2. Get unclaimed earnings
            const { data: unclaimedData } = await db.from('referral_earnings')
                .select('amount')
                .eq('referrer_id', userId)
                .eq('claimed', false);

            const unclaimedEarnings = unclaimedData
                ? (unclaimedData as { amount: number }[]).reduce((sum, row) => sum + Number(row.amount), 0)
                : 0;

            // 3. Count direct referrals (L1 - users who have referred_by = this user)
            const { count: directReferrals } = await db.from('users')
                .select('*', { count: 'exact', head: true })
                .eq('referred_by', userId);

            const totalInvites = directReferrals || 0;

            // 4. Get network size (L1 + L2 + L3)
            const network = await this.getReferralNetwork(userId);
            const networkSize = network.length;

            // 5. Calculate tier based on total invites (simplified - real tier calculation needs loan volume)
            let tier: 'BRONZE' | 'SILVER' | 'GOLD' = 'BRONZE';
            if (totalInvites >= 10) {
                tier = 'GOLD';
            } else if (totalInvites >= 3) {
                tier = 'SILVER';
            }

            // 6. Calculate progress to next tier
            let nextTierProgress = 0;
            let nextTierRemaining = '';
            if (tier === 'BRONZE') {
                nextTierProgress = Math.min(100, Math.round((totalInvites / 3) * 100));
                nextTierRemaining = `${totalInvites}/3 Referrals`;
            } else if (tier === 'SILVER') {
                nextTierProgress = Math.min(100, Math.round(((totalInvites - 3) / 7) * 100));
                nextTierRemaining = `${totalInvites}/10 Referrals`;
            } else {
                nextTierProgress = 100;
                nextTierRemaining = 'Max tier reached';
            }

            // 7. Get recent invites (last 5 direct referrals)
            const { data: recentReferrals } = await db.from('users')
                .select('wallet_address, created_at')
                .eq('referred_by', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            const recentInvites = recentReferrals
                ? (recentReferrals as { wallet_address: string; created_at: string }[]).map(ref => ({
                    wallet_address: ref.wallet_address,
                    display_name: `${ref.wallet_address.slice(0, 6)}...${ref.wallet_address.slice(-4)}`,
                    tier: 'BRONZE' as const,
                    joined_at: new Date(ref.created_at).toISOString().split('T')[0],
                    saved_monthly: 0, // Requires on-chain loan data
                    status: 'active' as const,
                }))
                : [];

            return {
                tier,
                total_earnings: totalEarnings,
                total_invites: totalInvites,
                network_volume: 0, // Requires on-chain loan data
                network_size: networkSize,
                inflation_avoided: 0, // Requires on-chain loan data
                interest_saved: unclaimedEarnings, // Show unclaimed as "interest saved"
                next_tier_progress: nextTierProgress,
                next_tier_remaining: nextTierRemaining,
                recent_invites: recentInvites,
            };
        } catch (error) {
            console.error('[ReferralDB] Error fetching stats:', error);
            // Return empty stats on error
            return {
                tier: 'BRONZE',
                total_earnings: 0,
                total_invites: 0,
                network_volume: 0,
                network_size: 0,
                inflation_avoided: 0,
                interest_saved: 0,
                next_tier_progress: 0,
                next_tier_remaining: '0/3 Referrals',
                recent_invites: [],
            };
        }
    }

    /**
     * Get leaderboard data (top referrers and top by deposits)
     */
    async getLeaderboard(currentUserWallet?: string): Promise<{
        topReferrers: { rank: number; walletAddress: string; referralCount: number; totalDeposits: number; isCurrentUser: boolean }[];
        topByDeposits: { rank: number; walletAddress: string; referralCount: number; totalDeposits: number; isCurrentUser: boolean }[];
        userRank: { byReferrals: number; byDeposits: number } | null;
    }> {
        // Fallback to empty data if Supabase not configured
        if (!isSupabaseConfigured() || !db) {
            return {
                topReferrers: [],
                topByDeposits: [],
                userRank: null,
            };
        }

        try {
            const normalizedWallet = currentUserWallet?.toLowerCase();

            // Get all users with their referral counts
            // Note: total_deposits is not in the DB schema yet - would need on-chain data
            const { data: usersWithReferrals, error: usersError } = await db.from('users')
                .select(`
                    id,
                    wallet_address
                `);

            console.log('[ReferralDB] Leaderboard query - users count:', usersWithReferrals?.length || 0, 'error:', usersError);

            if (!usersWithReferrals || usersError) {
                console.error('[ReferralDB] Failed to fetch users:', usersError);
                return { topReferrers: [], topByDeposits: [], userRank: null };
            }

            // Count referrals for each user (users who have referred_by = user.id)
            const userReferralCounts: Map<string, number> = new Map();
            for (const user of usersWithReferrals) {
                const { count } = await db.from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('referred_by', user.id);
                userReferralCounts.set(user.id, count || 0);
            }

            // Build entries with referral counts
            // Note: totalDeposits is 0 for now - would need on-chain data integration
            const entries = usersWithReferrals.map(user => ({
                walletAddress: user.wallet_address,
                referralCount: userReferralCounts.get(user.id) || 0,
                totalDeposits: 0,
                isCurrentUser: normalizedWallet ? user.wallet_address.toLowerCase() === normalizedWallet : false,
            }));

            // Build a Set of Stack'd user wallet addresses for fast lookup
            const stackdUserAddresses = new Set(
                usersWithReferrals.map(u => u.wallet_address.toLowerCase())
            );
            console.log('[ReferralDB] Stack\'d users count:', stackdUserAddresses.size);

            // Log referral counts for debugging
            const usersWithReferrals2 = entries.filter(e => e.referralCount > 0);
            console.log('[ReferralDB] Users with referrals:', usersWithReferrals2.length, usersWithReferrals2.slice(0, 3));

            // Sort by referral count for top referrers
            const sortedByReferrals = [...entries]
                .filter(e => e.referralCount > 0)
                .sort((a, b) => b.referralCount - a.referralCount)
                .slice(0, 10)
                .map((e, i) => ({ ...e, rank: i + 1 }));

            // Fetch deposits for each Stack'd user individually from BOTH protocols (Compound + Fluid)
            // This ensures we get ALL Stack'd users with deposits across all protocols
            const stackdDepositPromises = usersWithReferrals.map(async (user) => {
                const collateral = await getTotalCollateralByAddress(user.wallet_address);
                return {
                    walletAddress: user.wallet_address.toLowerCase(),
                    totalDepositsUsd: collateral?.totalCollateralUsd || 0,
                };
            });

            const stackdDeposits = await Promise.all(stackdDepositPromises);

            // Filter users with deposits > 0 and sort by deposit amount
            const stackdDepositors = stackdDeposits
                .filter(d => d.totalDepositsUsd > 0)
                .sort((a, b) => b.totalDepositsUsd - a.totalDepositsUsd)
                .slice(0, 10);

            console.log('[ReferralDB] Stack\'d users with deposits:', stackdDepositors.length, stackdDepositors.slice(0, 3));

            // Transform filtered data to leaderboard format with correct ranks
            const sortedByDeposits = stackdDepositors.map((depositor, index) => ({
                rank: index + 1,
                walletAddress: depositor.walletAddress,
                referralCount: 0, // Deposits tab doesn't need referral count
                totalDeposits: depositor.totalDepositsUsd,
                isCurrentUser: normalizedWallet ? depositor.walletAddress.toLowerCase() === normalizedWallet : false,
            }));

            // Calculate user's rank if they're authenticated
            let userRank: { byReferrals: number; byDeposits: number } | null = null;
            if (normalizedWallet) {
                const userEntry = entries.find(e => e.isCurrentUser);
                if (userEntry) {
                    // Count users with more referrals
                    const referralRank = entries.filter(e => e.referralCount > userEntry.referralCount).length + 1;

                    // Get user's total collateral from BOTH protocols for deposit rank (among Stack'd users only)
                    let depositsRank = 0;
                    const userCollateral = await getTotalCollateralByAddress(normalizedWallet);
                    if (userCollateral && userCollateral.totalCollateralUsd > 0) {
                        // Count Stack'd depositors with more deposits than user
                        depositsRank = stackdDeposits.filter(d => d.totalDepositsUsd > userCollateral.totalCollateralUsd).length + 1;
                    }

                    userRank = {
                        byReferrals: referralRank,
                        byDeposits: depositsRank,
                    };
                }
            }

            console.log('[ReferralDB] Final response - topReferrers:', sortedByReferrals.length, 'topByDeposits:', sortedByDeposits.length);
            return {
                topReferrers: sortedByReferrals,
                topByDeposits: sortedByDeposits,
                userRank,
            };
        } catch (error) {
            console.error('[ReferralDB] Error fetching leaderboard:', error);
            return { topReferrers: [], topByDeposits: [], userRank: null };
        }
    }
}

export const referralDb = new ReferralDatabaseService();

