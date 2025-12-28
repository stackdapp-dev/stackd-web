import { DbUser, ReferralStats, UserTier } from './types';

// Simulation of latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDatabaseService {
    private users: Map<string, DbUser> = new Map();
    private referralCodes: Map<string, string> = new Map(); // code -> userId

    constructor() {
        this.seed();
    }

    private seed() {
        // Seed a "Connector" User
        this.users.set('user_123', {
            id: 'user_123',
            wallet_address: '0x123...abc',
            created_at: new Date().toISOString(),
            referral_code: 'STACKM0CK1'
        });
        this.referralCodes.set('STACKM0CK1', 'user_123');
    }

    async getUser(id: string): Promise<DbUser | null> {
        await delay(300);
        return this.users.get(id) || null;
    }

    async createReferralCode(userId: string): Promise<string> {
        await delay(500);
        const code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Update user
        const user = this.users.get(userId);
        if (user) {
            user.referral_code = code;
            this.users.set(userId, user);
            this.referralCodes.set(code, userId);
        }
        return code;
    }

    async getReferralStats(userId: string): Promise<ReferralStats> {
        await delay(400);
        // Hardcoded stats based on "Connector" persona from Strategy
        // Silver tier user with good progress toward Gold
        return {
            tier: 'SILVER',
            total_earnings: 850.50,
            total_invites: 12,
            network_volume: 156000,
            network_size: 42,

            // New mockup-specific fields
            inflation_avoided: 1250.00,
            interest_saved: 425.75,
            next_tier_progress: 65, // 65% toward Gold
            next_tier_remaining: '7/10 Referrals',

            recent_invites: [
                {
                    wallet_address: '0xabc1234567890def1234567890abcdef12345678',
                    display_name: 'Alex M.',
                    tier: 'SILVER',
                    joined_at: '2025-12-20',
                    saved_monthly: 12.50,
                    status: 'active'
                },
                {
                    wallet_address: '0xdef9876543210abc9876543210fedcba98765432',
                    display_name: 'Jordan K.',
                    tier: 'BRONZE',
                    joined_at: '2025-12-18',
                    saved_monthly: 8.25,
                    status: 'active'
                },
                {
                    wallet_address: '0x789abcdef123456789abcdef1234567890abcdef',
                    tier: 'BRONZE',
                    joined_at: '2025-12-15',
                    saved_monthly: 5.00,
                    status: 'pending'
                },
                {
                    wallet_address: '0x456fedcba987654321fedcba9876543210fedcba',
                    display_name: 'Sam T.',
                    tier: 'SILVER',
                    joined_at: '2025-12-12',
                    saved_monthly: 15.75,
                    status: 'active'
                },
                {
                    wallet_address: '0x321abcdef654321abcdef654321abcdef654321a',
                    tier: 'BRONZE',
                    joined_at: '2025-12-10',
                    saved_monthly: 3.50,
                    status: 'active'
                },
            ]
        };
    }

    async joinReferral(refereeId: string, code: string): Promise<boolean> {
        await delay(600);
        if (!this.referralCodes.has(code)) return false;
        const referrerId = this.referralCodes.get(code);

        const user = this.users.get(refereeId);
        if (user) {
            user.referred_by = referrerId;
            this.users.set(refereeId, user);
            return true;
        }
        return false;
    }
}

export const dbService = new MockDatabaseService();
