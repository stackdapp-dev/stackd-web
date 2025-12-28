/**
 * API Route Tests: POST /api/referrals/claim
 * 
 * Tests all success and failure scenarios for claiming referral earnings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to properly hoist mock functions
const {
    mockGetUserByWallet,
    mockClaimEarnings,
    mockVerifyAuthToken,
    mockIsPrivyServerConfigured,
    mockGetUserTier,
    mockCanWithdrawEarnings,
} = vi.hoisted(() => ({
    mockGetUserByWallet: vi.fn(),
    mockClaimEarnings: vi.fn(),
    mockVerifyAuthToken: vi.fn(),
    mockIsPrivyServerConfigured: vi.fn(),
    mockGetUserTier: vi.fn(),
    mockCanWithdrawEarnings: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/db/referralDb', () => ({
    referralDb: {
        getUserByWallet: mockGetUserByWallet,
        claimEarnings: mockClaimEarnings,
    },
}));

vi.mock('@/lib/auth/privy-server', () => ({
    verifyAuthToken: mockVerifyAuthToken,
    isPrivyServerConfigured: mockIsPrivyServerConfigured,
}));

vi.mock('@/lib/referrals/tiers', () => ({
    getUserTier: mockGetUserTier,
    canWithdrawEarnings: mockCanWithdrawEarnings,
}));

// Import after mocks
import { POST } from '@/app/api/referrals/claim/route';

describe('POST /api/referrals/claim', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsPrivyServerConfigured.mockReturnValue(true);
    });

    const createRequest = (headers: Record<string, string> = {}) => {
        return new NextRequest('http://localhost:3000/api/referrals/claim', {
            method: 'POST',
            headers,
        });
    };

    it('successfully claims earnings for Silver tier user', async () => {
        // Arrange
        const mockUser = {
            id: 'user_silver',
            wallet_address: '0xsilver',
            referral_code: 'STACKSIL',
            created_at: new Date().toISOString(),
        };

        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_silver',
            walletAddress: '0xsilver',
        });
        mockGetUserByWallet.mockResolvedValue(mockUser);
        mockGetUserTier.mockReturnValue('SILVER');
        mockCanWithdrawEarnings.mockReturnValue(true);
        mockClaimEarnings.mockResolvedValue({
            success: true,
            amount: 150.75,
        });

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.amount).toBe(150.75);
        expect(data.tier).toBe('SILVER');
        expect(data.message).toContain('150.75');
    });

    it('successfully claims earnings for Gold tier user', async () => {
        // Arrange
        const mockUser = {
            id: 'user_gold',
            wallet_address: '0xgold',
            referral_code: 'STACKGLD',
            created_at: new Date().toISOString(),
        };

        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_gold',
            walletAddress: '0xgold',
        });
        mockGetUserByWallet.mockResolvedValue(mockUser);
        mockGetUserTier.mockReturnValue('GOLD');
        mockCanWithdrawEarnings.mockReturnValue(true);
        mockClaimEarnings.mockResolvedValue({
            success: true,
            amount: 500.00,
        });

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.tier).toBe('GOLD');
    });

    it('returns 403 for Bronze tier users (Silver Gate)', async () => {
        // Arrange
        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_bronze',
            walletAddress: '0xbronze',
        });
        mockGetUserByWallet.mockResolvedValue({
            id: 'user_bronze',
            wallet_address: '0xbronze',
            referral_code: 'STACKBRZ',
            created_at: new Date().toISOString(),
        });
        mockGetUserTier.mockReturnValue('BRONZE');
        mockCanWithdrawEarnings.mockReturnValue(false);

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(403);
        expect(data.error).toContain('Bronze tier cannot withdraw');
        expect(data.tier).toBe('BRONZE');
    });

    it('returns 400 when no earnings to claim', async () => {
        // Arrange
        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_user',
            walletAddress: '0xnoearnings',
        });
        mockGetUserByWallet.mockResolvedValue({
            id: 'user_no_earnings',
            wallet_address: '0xnoearnings',
            referral_code: 'STACKNO',
            created_at: new Date().toISOString(),
        });
        mockGetUserTier.mockReturnValue('SILVER');
        mockCanWithdrawEarnings.mockReturnValue(true);
        mockClaimEarnings.mockResolvedValue({
            success: false,
            amount: 0,
        });

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('No earnings to claim');
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

    it('returns 500 on database error', async () => {
        // Arrange
        mockVerifyAuthToken.mockResolvedValue({
            userId: 'privy_user',
            walletAddress: '0xabc',
        });
        mockGetUserByWallet.mockRejectedValue(new Error('DB connection failed'));

        // Act
        const request = createRequest({ 'Authorization': 'Bearer valid_token' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.error).toContain('Failed');
    });
});
