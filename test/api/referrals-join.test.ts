/**
 * API Route Tests: POST /api/referrals/join
 * 
 * Tests all success and failure scenarios for joining referral program
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to properly hoist mock functions
const { mockJoinReferral } = vi.hoisted(() => ({
    mockJoinReferral: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/db/referralDb', () => ({
    referralDb: {
        joinReferral: mockJoinReferral,
    },
}));

// Import after mocks
import { POST } from '@/app/api/referrals/join/route';

describe('POST /api/referrals/join', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (body: object) => {
        return new NextRequest('http://localhost:3000/api/referrals/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    };

    it('successfully joins with valid code and wallet', async () => {
        // Arrange
        mockJoinReferral.mockResolvedValue(true);

        // Act
        const request = createRequest({
            code: 'STACK123',
            walletAddress: '0x1234567890123456789012345678901234567890',
        });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockJoinReferral).toHaveBeenCalledWith(
            '0x1234567890123456789012345678901234567890',
            'STACK123'
        );
    });

    it('links referee to referrer in database', async () => {
        // Arrange
        mockJoinReferral.mockResolvedValue(true);

        // Act
        const request = createRequest({
            code: 'STACKREF',
            walletAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
        });
        await POST(request);

        // Assert
        expect(mockJoinReferral).toHaveBeenCalledWith(
            '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
            'STACKREF'
        );
    });

    it('returns 400 for invalid referral code', async () => {
        // Arrange
        mockJoinReferral.mockResolvedValue(false);

        // Act
        const request = createRequest({
            code: 'BADCODE',
            walletAddress: '0xDEADBEEF12345678DEADBEEF12345678DEADBEEF',
        });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid referral code');
    });

    it('returns 400 when user already has a referrer', async () => {
        // Arrange
        mockJoinReferral.mockResolvedValue(false);

        // Act
        const request = createRequest({
            code: 'STACK123',
            walletAddress: '0xAAAABBBBCCCCDDDD1111222233334444AAAABBBB',
        });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid referral code or already referred');
    });

    it('returns 400 when code is missing', async () => {
        // Act
        const request = createRequest({
            walletAddress: '0xDEADBEEF12345678DEADBEEF12345678DEADBEEF',
        });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing code');
    });

    it('returns 400 when wallet address is missing', async () => {
        // Act
        const request = createRequest({
            code: 'STACK123',
        });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing');
    });

    it('returns 400 for empty body', async () => {
        // Act
        const request = createRequest({});
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing code or wallet');
    });

    it('returns 500 on database error', async () => {
        // Arrange
        mockJoinReferral.mockRejectedValue(new Error('DB error'));

        // Act
        const request = createRequest({
            code: 'STACK123',
            walletAddress: '0xDEADBEEF12345678DEADBEEF12345678DEADBEEF',
        });
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.error).toContain('Failed');
    });
});
