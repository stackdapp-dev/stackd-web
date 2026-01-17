export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK';

export interface DbUser {
    id: string;
    wallet_address: string;
    created_at: string;
    referral_code?: string;
    referred_by?: string; // ID of the referrer
}

export interface ReferralCode {
    code: string;
    user_id: string;
    created_at: string;
}

export interface ReferralRelationship {
    referrer_id: string;
    referee_id: string;
    created_at: string;
    status: 'active' | 'pending';
}

export interface RecentInvite {
    wallet_address: string;
    display_name?: string; // "Alex M." or formatted address
    tier: UserTier;
    joined_at: string;
    saved_monthly: number; // Impact metric: $12.50/mo saved
    status: 'pending' | 'active';
}

export interface ReferralStats {
    tier: UserTier;
    total_earnings: number;
    total_invites: number; // Direct (L1)
    network_volume: number; // Total loan volume of referees
    network_size: number; // Total referees (L1+L2+L3)

    // New fields for UI mockups
    inflation_avoided: number; // Currency: e.g., $1,250.00
    interest_saved: number; // Currency: e.g., $850.00
    next_tier_progress: number; // 0-100 percentage
    next_tier_remaining: string; // e.g., "3/10 Referrals" or "$7,500 to Gold"

    recent_invites: RecentInvite[];
}
