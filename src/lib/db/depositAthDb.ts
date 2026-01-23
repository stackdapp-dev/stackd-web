/**
 * Deposit ATH Database Service
 *
 * Manages All-Time High (ATH) deposit tracking for the leaderboard.
 * Stores and retrieves the highest deposit value each wallet has ever achieved.
 */

import { isSupabaseConfigured } from './supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: SupabaseClient<any, 'public', any> | null = null;
if (supabaseUrl && supabaseServiceKey) {
    db = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Deposit ATH record type
 */
export interface DepositAth {
    id: string;
    wallet_address: string;
    ath_usd: number;
    ath_compound_usd: number;
    ath_fluid_usd: number;
    recorded_at: string;
    created_at: string;
    updated_at: string;
}

/**
 * Collateral data for ATH comparison
 */
export interface CollateralData {
    totalCollateralUsd: number;
    compoundCollateralUsd: number;
    fluidCollateralUsd: number;
}

/**
 * Get ATH record for a specific wallet
 */
export async function getAthByWallet(walletAddress: string): Promise<DepositAth | null> {
    if (!isSupabaseConfigured() || !db) {
        return null;
    }

    try {
        const normalizedAddress = walletAddress.toLowerCase();
        const { data, error } = await db
            .from('deposit_ath')
            .select('*')
            .eq('wallet_address', normalizedAddress)
            .single();

        if (error || !data) {
            return null;
        }

        return data as DepositAth;
    } catch (error) {
        console.error('[DepositAthDb] Error fetching ATH:', error);
        return null;
    }
}

/**
 * Update ATH if current collateral exceeds stored ATH
 * Creates new record if wallet has no existing ATH
 *
 * @returns The ATH record (updated or existing)
 */
export async function updateAthIfHigher(
    walletAddress: string,
    collateral: CollateralData
): Promise<DepositAth | null> {
    if (!isSupabaseConfigured() || !db) {
        return null;
    }

    try {
        const normalizedAddress = walletAddress.toLowerCase();

        // Get existing ATH
        const { data: existing } = await db
            .from('deposit_ath')
            .select('*')
            .eq('wallet_address', normalizedAddress)
            .single();

        // If no existing record, insert new one
        if (!existing) {
            const { data: inserted, error: insertError } = await db
                .from('deposit_ath')
                .insert({
                    wallet_address: normalizedAddress,
                    ath_usd: collateral.totalCollateralUsd,
                    ath_compound_usd: collateral.compoundCollateralUsd,
                    ath_fluid_usd: collateral.fluidCollateralUsd,
                    recorded_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (insertError) {
                console.error('[DepositAthDb] Error inserting ATH:', insertError);
                return null;
            }

            console.log(`[DepositAthDb] Created ATH for ${normalizedAddress}: $${collateral.totalCollateralUsd}`);
            return inserted as DepositAth;
        }

        // If current collateral exceeds ATH, update
        if (collateral.totalCollateralUsd > existing.ath_usd) {
            const { data: updated, error: updateError } = await db
                .from('deposit_ath')
                .update({
                    ath_usd: collateral.totalCollateralUsd,
                    ath_compound_usd: collateral.compoundCollateralUsd,
                    ath_fluid_usd: collateral.fluidCollateralUsd,
                    recorded_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('wallet_address', normalizedAddress)
                .select()
                .single();

            if (updateError) {
                console.error('[DepositAthDb] Error updating ATH:', updateError);
                return existing as DepositAth;
            }

            console.log(`[DepositAthDb] Updated ATH for ${normalizedAddress}: $${existing.ath_usd} → $${collateral.totalCollateralUsd}`);
            return updated as DepositAth;
        }

        // Current is lower or equal, return existing ATH
        return existing as DepositAth;
    } catch (error) {
        console.error('[DepositAthDb] Error in updateAthIfHigher:', error);
        return null;
    }
}

/**
 * Get top N depositors by ATH for leaderboard
 */
export async function getTopAthDepositors(limit: number = 10): Promise<DepositAth[]> {
    if (!isSupabaseConfigured() || !db) {
        return [];
    }

    try {
        const { data, error } = await db
            .from('deposit_ath')
            .select('*')
            .order('ath_usd', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[DepositAthDb] Error fetching top depositors:', error);
            return [];
        }

        return (data || []) as DepositAth[];
    } catch (error) {
        console.error('[DepositAthDb] Error in getTopAthDepositors:', error);
        return [];
    }
}

/**
 * Seed ATH for all existing users (one-time migration)
 * Fetches current collateral for each user and sets as initial ATH
 */
export async function seedAllUsersAth(
    getCollateralForWallet: (wallet: string) => Promise<CollateralData | null>
): Promise<{ seeded: number; failed: number }> {
    if (!isSupabaseConfigured() || !db) {
        return { seeded: 0, failed: 0 };
    }

    try {
        // Get all users from the users table
        const { data: users, error } = await db
            .from('users')
            .select('wallet_address');

        if (error || !users) {
            console.error('[DepositAthDb] Error fetching users for seeding:', error);
            return { seeded: 0, failed: 0 };
        }

        let seeded = 0;
        let failed = 0;

        for (const user of users) {
            try {
                const collateral = await getCollateralForWallet(user.wallet_address);
                if (collateral && collateral.totalCollateralUsd > 0) {
                    await updateAthIfHigher(user.wallet_address, collateral);
                    seeded++;
                    console.log(`[DepositAthDb] Seeded ATH for ${user.wallet_address}: $${collateral.totalCollateralUsd}`);
                }
            } catch (err) {
                console.error(`[DepositAthDb] Failed to seed ATH for ${user.wallet_address}:`, err);
                failed++;
            }
        }

        return { seeded, failed };
    } catch (error) {
        console.error('[DepositAthDb] Error in seedAllUsersAth:', error);
        return { seeded: 0, failed: 0 };
    }
}
