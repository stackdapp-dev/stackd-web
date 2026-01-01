/**
 * Leaderboard types and mock data service
 */

export interface LeaderboardEntry {
    rank: number;
    walletAddress: string;
    referralCount: number;
    totalDeposits: number;
    isCurrentUser: boolean;
}

export interface UserRank {
    byReferrals: number;
    byDeposits: number;
}

export interface LeaderboardData {
    topReferrers: LeaderboardEntry[];
    topByDeposits: LeaderboardEntry[];
    userRank: UserRank | null;
}

/**
 * Anonymize wallet address for display (0x1234...5678)
 */
export function anonymizeAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generate mock leaderboard data for development/testing
 */
export function mockLeaderboardData(currentUserAddress?: string): LeaderboardData {
    // Generate random wallet addresses
    const generateAddress = () => {
        const chars = "0123456789abcdef";
        let addr = "0x";
        for (let i = 0; i < 40; i++) {
            addr += chars[Math.floor(Math.random() * chars.length)];
        }
        return addr;
    };

    // Generate mock entries sorted by referral count
    const mockReferrers: LeaderboardEntry[] = [
        { rank: 1, walletAddress: "0x1a2b3c4d5e6f7890abcdef1234567890abcd1234", referralCount: 127, totalDeposits: 485000, isCurrentUser: false },
        { rank: 2, walletAddress: "0x2b3c4d5e6f7890abcdef1234567890abcd12345a", referralCount: 98, totalDeposits: 312000, isCurrentUser: false },
        { rank: 3, walletAddress: "0x3c4d5e6f7890abcdef1234567890abcd12345ab6", referralCount: 76, totalDeposits: 198000, isCurrentUser: false },
        { rank: 4, walletAddress: "0x4d5e6f7890abcdef1234567890abcd12345abc78", referralCount: 54, totalDeposits: 156000, isCurrentUser: false },
        { rank: 5, walletAddress: "0x5e6f7890abcdef1234567890abcd12345abcd890", referralCount: 43, totalDeposits: 132000, isCurrentUser: false },
        { rank: 6, walletAddress: "0x6f7890abcdef1234567890abcd12345abcde9012", referralCount: 38, totalDeposits: 98000, isCurrentUser: false },
        { rank: 7, walletAddress: "0x7890abcdef1234567890abcd12345abcdef01234", referralCount: 31, totalDeposits: 87500, isCurrentUser: false },
        { rank: 8, walletAddress: currentUserAddress || "0x890abcdef1234567890abcd12345abcdef012345", referralCount: 24, totalDeposits: 62000, isCurrentUser: true },
        { rank: 9, walletAddress: "0x90abcdef1234567890abcd12345abcdef0123456", referralCount: 19, totalDeposits: 45000, isCurrentUser: false },
        { rank: 10, walletAddress: "0x0abcdef1234567890abcd12345abcdef01234567", referralCount: 15, totalDeposits: 38000, isCurrentUser: false },
    ];

    // Generate mock entries sorted by deposits
    const mockByDeposits: LeaderboardEntry[] = [
        { rank: 1, walletAddress: "0xdeadbeef1234567890abcdef1234567890abcdef", referralCount: 45, totalDeposits: 892000, isCurrentUser: false },
        { rank: 2, walletAddress: "0x1a2b3c4d5e6f7890abcdef1234567890abcd1234", referralCount: 127, totalDeposits: 485000, isCurrentUser: false },
        { rank: 3, walletAddress: "0xcafe12345678901234567890abcdef1234567890", referralCount: 32, totalDeposits: 378000, isCurrentUser: false },
        { rank: 4, walletAddress: "0x2b3c4d5e6f7890abcdef1234567890abcd12345a", referralCount: 98, totalDeposits: 312000, isCurrentUser: false },
        { rank: 5, walletAddress: "0xbabe98765432109876543210fedcba0987654321", referralCount: 28, totalDeposits: 245000, isCurrentUser: false },
        { rank: 6, walletAddress: "0x3c4d5e6f7890abcdef1234567890abcd12345ab6", referralCount: 76, totalDeposits: 198000, isCurrentUser: false },
        { rank: 7, walletAddress: "0x4d5e6f7890abcdef1234567890abcd12345abc78", referralCount: 54, totalDeposits: 156000, isCurrentUser: false },
        { rank: 8, walletAddress: "0x5e6f7890abcdef1234567890abcd12345abcd890", referralCount: 43, totalDeposits: 132000, isCurrentUser: false },
        { rank: 9, walletAddress: "0x6f7890abcdef1234567890abcd12345abcde9012", referralCount: 38, totalDeposits: 98000, isCurrentUser: false },
        { rank: 10, walletAddress: currentUserAddress || "0x890abcdef1234567890abcd12345abcdef012345", referralCount: 24, totalDeposits: 62000, isCurrentUser: true },
    ];

    // Find user's rank in each list
    const userReferrerRank = mockReferrers.findIndex((e) => e.isCurrentUser) + 1;
    const userDepositsRank = mockByDeposits.findIndex((e) => e.isCurrentUser) + 1;

    return {
        topReferrers: mockReferrers,
        topByDeposits: mockByDeposits,
        userRank: {
            byReferrals: userReferrerRank || null,
            byDeposits: userDepositsRank || null,
        } as UserRank,
    };
}
