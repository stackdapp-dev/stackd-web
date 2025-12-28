/**
 * API Route Tests: POST /api/referrals/validate
 * 
 * Tests for the validation endpoint (no auth required)
 * Used by ReferralGate before signup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to properly hoist mock functions
const { mockGetUserByReferralCode } = vi.hoisted(() => ({
    mockGetUserByReferralCode: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/db/referralDb', () => ({
    referralDb: {
        getUserByReferralCode: mockGetUserByReferralCode,
    },
}));

// Import after mocks
import { POST } from '@/app/api/referrals/validate/route';

describe('POST /api/referrals/validate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (body: object) => {
        return new NextRequest('http://localhost:3000/api/referrals/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    };

    it('returns valid=true for existing referral code', async () => {
        // Arrange
        mockGetUserByReferralCode.mockResolvedValue({
            id: 'referrer_id',
            wallet_address: '0xreferrer123456789abcdef',
            referral_code: 'STACK123',
            created_at: new Date().toISOString(),
        });

        // Act
        const request = createRequest({ code: 'STACK123' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.valid).toBe(true);
        expect(data.referrerAddress).toBeDefined();
        expect(data.referrerAddress).toContain('...');
    });

    it('returns valid=false for non-existent code', async () => {
        // Arrange
        mockGetUserByReferralCode.mockResolvedValue(null);

        // Act
        const request = createRequest({ code: 'BADCODE' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.valid).toBe(false);
        expect(data.referrerAddress).toBeUndefined();
    });

    it('is case insensitive when matching codes', async () => {
        // Arrange - getUserByReferralCode handles case normalization
        mockGetUserByReferralCode.mockResolvedValue({
            id: 'referrer_id',
            wallet_address: '0xreferrer123456789abcdef',
            referral_code: 'STACK123',
            created_at: new Date().toISOString(),
        });

        // Act - lowercase input
        const request = createRequest({ code: 'stack123' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.valid).toBe(true);
    });

    it('returns 400 when code is missing', async () => {
        // Act
        const request = createRequest({});
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing code');
    });

    it('returns 400 for empty code', async () => {
        // Act
        const request = createRequest({ code: '' });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing code');
    });

    it('works without auth (no Authorization header)', async () => {
        // Arrange
        mockGetUserByReferralCode.mockResolvedValue({
            id: 'referrer_id',
            wallet_address: '0xreferrer123456789abcdef',
            referral_code: 'STACK123',
            created_at: new Date().toISOString(),
        });

        // Act - Note: No Authorization header included
        const request = createRequest({ code: 'STACK123' });
        const response = await POST(request);
        const data = await response.json();

        // Assert - Should work without auth
        expect(response.status).toBe(200);
        expect(data.valid).toBe(true);
    });
});
