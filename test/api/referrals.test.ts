/**
 * API Route Tests: GET /api/referrals & POST /api/referrals
 * 
 * Tests all success and failure scenarios for the referrals endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to properly hoist mock functions
const {
    mockGetOrCreateUser,
    mockGetReferralStats,
    mockGetUnclaimedEarnings,
    mockVerifyAuthToken,
    mockIsPrivyServerConfigured,
} = vi.hoisted(() => ({
    mockGetOrCreateUser: vi.fn(),
    mockGetReferralStats: vi.fn(),
    mockGetUnclaimedEarnings: vi.fn(),
    mockVerifyAuthToken: vi.fn(),
    mockIsPrivyServerConfigured: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/db/referralDb', () => ({
    referralDb: {
        getOrCreateUser: mockGetOrCreateUser,
        getReferralStats: mockGetReferralStats,
        getUnclaimedEarnings: mockGetUnclaimedEarnings,
    },
}));

vi.mock('@/lib/auth/privy-server', () => ({
    verifyAuthToken: mockVerifyAuthToken,
    isPrivyServerConfigured: mockIsPrivyServerConfigured,
}));

// Import after mocks
import { GET, POST } from '@/app/api/referrals/route';

describe('GET /api/referrals', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: Privy is configured
        mockIsPrivyServerConfigured.mockReturnValue(true);
    });

    const createRequest = (headers: Record<string, string> = {}) => {
        return new NextRequest('http://localhost:3000/api/referrals', {
            method: 'GET',
            headers,
        });
    };

    it('returns stats for authenticated user with existing account', async () => {
        // Arrange
        const mockUser = {
            id: 'user_123',
            wallet_address: '0xabc123',
            referral_code: 'STACK123',
            created_at: new Date().toISOString(),
        };
        const mockStats = {
            tier: 'SILVER' as const,
            total_earnings: 100,
            total_invites: 5,
            network_volume: 5000,
            network_size: 10,
            inflation_avoided: 50,
            interest_saved: 25,
            next_tier_progress: 50,
            next_tier_remaining: '5/10 Referrals',
            recent_invites: [],
        };

        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_user_123',
            walletAddress: '0xabc123',
        });
        mockGetOrCreateUser.mockResolvedValue(mockUser);
        mockGetReferralStats.mockResolvedValue(mockStats);
        mockGetUnclaimedEarnings.mockResolvedValue(42.50);

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.referral_code).toBe('STACK123');
        expect(data.unclaimed_earnings).toBe(42.50);
        expect(data.tier).toBe('SILVER');
    });

    it('auto-creates user for authenticated new user', async () => {
        // Arrange
        const mockNewUser = {
            id: 'new_user_456',
            wallet_address: '0xnewuser',
            referral_code: 'STACKNEW',
            created_at: new Date().toISOString(),
        };
        const mockStats = {
            tier: 'BRONZE' as const,
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

        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_new_user',
            walletAddress: '0xnewuser',
        });
        mockGetOrCreateUser.mockResolvedValue(mockNewUser);
        mockGetReferralStats.mockResolvedValue(mockStats);
        mockGetUnclaimedEarnings.mockResolvedValue(0);

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.referral_code).toBe('STACKNEW');
        expect(data.tier).toBe('BRONZE');
        expect(mockGetOrCreateUser).toHaveBeenCalledWith('0xnewuser');
    });

    it('returns 401 for missing auth token in production', async () => {
        // Arrange
        vi.stubEnv('NODE_ENV', 'production');
        mockVerifyAuthToken.mockResolvedValue(null);

        // Act
        const request = createRequest(); // No Authorization header
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');

        // Cleanup
        vi.unstubAllEnvs();
    });

    it('returns 401 in development without auth (fail closed)', async () => {
        // Arrange - auth bypass in dev mode has been removed
        vi.stubEnv('NODE_ENV', 'development');
        mockVerifyAuthToken.mockResolvedValue(null);

        // Act
        const request = createRequest(); // No Authorization header
        const response = await GET(request);
        const data = await response.json();

        // Assert - should be 401 even in development
        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');

        // Cleanup
        vi.unstubAllEnvs();
    });

    it('returns 401 for invalid/expired auth token', async () => {
        // Arrange
        vi.stubEnv('NODE_ENV', 'production');
        mockVerifyAuthToken.mockResolvedValue(null);

        // Act
        const request = createRequest({ 'Authorization': 'Bearer invalid_token' });
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');

        // Cleanup
        vi.unstubAllEnvs();
    });

    it('returns 500 on database error', async () => {
        // Arrange
        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_user',
            walletAddress: '0xabc',
        });
        mockGetOrCreateUser.mockRejectedValue(new Error('DB connection failed'));

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.error).toContain('Failed');
    });
});

describe('POST /api/referrals', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsPrivyServerConfigured.mockReturnValue(true);
    });

    const createRequest = (headers: Record<string, string> = {}) => {
        return new NextRequest('http://localhost:3000/api/referrals', {
            method: 'POST',
            headers,
        });
    };

    it('generates new referral code for first-time user', async () => {
        // Arrange
        const mockUser = {
            id: 'new_user',
            wallet_address: '0xnew',
            referral_code: 'STACKABC',
            created_at: new Date().toISOString(),
        };

        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_new',
            walletAddress: '0xnew',
        });
        mockGetOrCreateUser.mockResolvedValue(mockUser);

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.code).toBe('STACKABC');
        expect(data.user_id).toBe('new_user');
    });

    it('returns existing code for returning user', async () => {
        // Arrange
        const mockUser = {
            id: 'existing_user',
            wallet_address: '0xexisting',
            referral_code: 'STACKOLD',
            created_at: new Date().toISOString(),
        };

        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_existing',
            walletAddress: '0xexisting',
        });
        mockGetOrCreateUser.mockResolvedValue(mockUser);

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.code).toBe('STACKOLD');
    });

    it('returns 401 for missing auth token', async () => {
        // Arrange
        mockVerifyAuthToken.mockResolvedValue(null);

        // Act
        const request = createRequest(); // No Authorization header
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when auth has no wallet', async () => {
        // Arrange
        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_user',
            walletAddress: null,
        });

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('returns 500 on database error', async () => {
        // Arrange
        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_user',
            walletAddress: '0xabc',
        });
        mockGetOrCreateUser.mockRejectedValue(new Error('DB error'));

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.error).toContain('Failed');
    });
});
