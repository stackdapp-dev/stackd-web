/**
 * Referral Database Service
 * 
 * Handles all database operations for the referral system.
 * Uses Supabase when configured, falls back to mock data for development.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { dbService as mockDbService } from './mock';
import type { User, ReferralEarning, UserInsert } from './supabase.types';
import type { ReferralStats, UserTier } from './types';

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
        if (!isSupabaseConfigured()) {
            // Fall back to mock
            const mockUser = await mockDbService.getUser('user_123');
            return mockUser as unknown as User;
        }

        const normalizedAddress = walletAddress.toLowerCase();

        // Try to find existing user
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', normalizedAddress)
            .single();

        if (existingUser) {
            return existingUser;
        }

        // Create new user with referral code
        const referralCode = generateReferralCode();
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                wallet_address: normalizedAddress,
                referral_code: referralCode,
            })
            .select()
            .single();

        if (error) {
            console.error('[ReferralDB] Error creating user:', error);
            return null;
        }

        return newUser;
    }

    /**
     * Get user by wallet address
     */
    async getUserByWallet(walletAddress: string): Promise<User | null> {
        if (!isSupabaseConfigured()) {
            return mockDbService.getUser('user_123') as unknown as User;
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    /**
     * Get user by referral code
     */
    async getUserByReferralCode(code: string): Promise<User | null> {
        if (!isSupabaseConfigured()) {
            return null;
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('referral_code', code.toUpperCase())
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    /**
     * Link a referee to a referrer via referral code
     */
    async joinReferral(refereeWallet: string, referralCode: string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            return mockDbService.joinReferral('referee_999', referralCode);
        }

        // Get the referrer
        const referrer = await this.getUserByReferralCode(referralCode);
        if (!referrer) {
            return false;
        }

        // Get or create the referee
        const referee = await this.getOrCreateUser(refereeWallet);
        if (!referee) {
            return false;
        }

        // Check if already referred
        if (referee.referred_by) {
            return false;
        }

        // Update referee with referrer
        const { error } = await supabase
            .from('users')
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
        if (!isSupabaseConfigured()) {
            return [];
        }

        const network: { level: 1 | 2 | 3; user: User }[] = [];

        // L1: Direct referrals
        const { data: l1Users } = await supabase
            .from('users')
            .select('*')
            .eq('referred_by', userId);

        if (l1Users) {
            for (const user of l1Users) {
                network.push({ level: 1, user });

                // L2: Referrals of L1
                const { data: l2Users } = await supabase
                    .from('users')
                    .select('*')
                    .eq('referred_by', user.id);

                if (l2Users) {
                    for (const l2User of l2Users) {
                        network.push({ level: 2, user: l2User });

                        // L3: Referrals of L2
                        const { data: l3Users } = await supabase
                            .from('users')
                            .select('*')
                            .eq('referred_by', l2User.id);

                        if (l3Users) {
                            for (const l3User of l3Users) {
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
        if (!isSupabaseConfigured()) {
            return 42.85; // Mock value
        }

        const { data, error } = await supabase
            .from('referral_earnings')
            .select('amount')
            .eq('referrer_id', userId)
            .eq('claimed', false);

        if (error || !data) {
            return 0;
        }

        return data.reduce((sum, row) => sum + Number(row.amount), 0);
    }

    /**
     * Claim earnings for a user
     */
    async claimEarnings(userId: string): Promise<{ success: boolean; amount: number }> {
        if (!isSupabaseConfigured()) {
            return { success: true, amount: 42.85 };
        }

        // Get unclaimed earnings
        const { data: earnings, error: fetchError } = await supabase
            .from('referral_earnings')
            .select('id, amount')
            .eq('referrer_id', userId)
            .eq('claimed', false);

        if (fetchError || !earnings || earnings.length === 0) {
            return { success: false, amount: 0 };
        }

        const totalAmount = earnings.reduce((sum, row) => sum + Number(row.amount), 0);
        const earningIds = earnings.map(e => e.id);

        // Mark as claimed
        const { error: updateError } = await supabase
            .from('referral_earnings')
            .update({ claimed: true, claimed_at: new Date().toISOString() })
            .in('id', earningIds);

        if (updateError) {
            return { success: false, amount: 0 };
        }

        return { success: true, amount: totalAmount };
    }

    /**
     * Get referral stats (for dashboard display)
     * Falls back to mock for development
     */
    async getReferralStats(userId: string): Promise<ReferralStats> {
        if (!isSupabaseConfigured()) {
            return mockDbService.getReferralStats(userId);
        }

        // For now, return mock stats until we have real loan data integration
        // TODO: Integrate with on-chain loan data for real stats
        return mockDbService.getReferralStats(userId);
    }
}

export const referralDb = new ReferralDatabaseService();
