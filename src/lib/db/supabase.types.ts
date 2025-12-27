/**
 * Supabase Database Types
 * 
 * These types are auto-generated from the Supabase schema.
 * Run `supabase gen types typescript` to regenerate after schema changes.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK';

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    wallet_address: string;
                    referral_code: string | null;
                    referred_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    wallet_address: string;
                    referral_code?: string | null;
                    referred_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    wallet_address?: string;
                    referral_code?: string | null;
                    referred_by?: string | null;
                    created_at?: string;
                };
            };
            referral_earnings: {
                Row: {
                    id: string;
                    referrer_id: string;
                    referee_id: string;
                    level: number;
                    amount: number;
                    period: string;
                    claimed: boolean;
                    claimed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    referrer_id: string;
                    referee_id: string;
                    level: number;
                    amount: number;
                    period: string;
                    claimed?: boolean;
                    claimed_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    referrer_id?: string;
                    referee_id?: string;
                    level?: number;
                    amount?: number;
                    period?: string;
                    claimed?: boolean;
                    claimed_at?: string | null;
                    created_at?: string;
                };
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            user_tier: UserTier;
        };
    };
}

// Helper types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ReferralEarning = Database['public']['Tables']['referral_earnings']['Row'];
export type ReferralEarningInsert = Database['public']['Tables']['referral_earnings']['Insert'];
