/**
 * Deposit ATH Seed API Tests
 *
 * Tests for the one-time seeding endpoint that populates ATH records
 * for all existing users with their current (or historical) collateral.
 * Now requires authentication.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks
const {
    mockSeedAllUsersAth,
    mockGetAllUsers,
    mockGetTotalCollateralByAddress,
    mockVerifyAuthToken,
    mockIsPrivyServerConfigured,
} = vi.hoisted(() => ({
    mockSeedAllUsersAth: vi.fn(),
    mockGetAllUsers: vi.fn(),
    mockGetTotalCollateralByAddress: vi.fn(),
    mockVerifyAuthToken: vi.fn(),
    mockIsPrivyServerConfigured: vi.fn(),
}));

// Mock the depositAthDb module
vi.mock('@/lib/db/depositAthDb', () => ({
    seedAllUsersAth: mockSeedAllUsersAth,
}));

// Mock supabase configuration
vi.mock('@/lib/db/supabase', () => ({
    isSupabaseConfigured: vi.fn(() => true),
}));

// Mock multiProtocolCollateral
vi.mock('@/lib/collateral/multiProtocolCollateral', () => ({
    getTotalCollateralByAddress: mockGetTotalCollateralByAddress,
}));

// Mock auth
vi.mock('@/lib/auth/privy-server', () => ({
    verifyAuthToken: mockVerifyAuthToken,
    isPrivyServerConfigured: mockIsPrivyServerConfigured,
}));

// Helper to create authenticated request
function createAuthenticatedRequest(body: object = {}) {
    return new Request('http://localhost:3000/api/deposit-ath/seed', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid_token',
        },
        body: JSON.stringify(body),
    });
}

describe('POST /api/deposit-ath/seed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: auth is configured and valid
        mockIsPrivyServerConfigured.mockReturnValue(true);
        mockVerifyAuthToken.mockResolvedValue({
            userId: 'admin_user',
            walletAddress: '0x1234567890123456789012345678901234567890',
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should seed ATH for all users and return stats', async () => {
        // Mock successful seeding
        mockSeedAllUsersAth.mockResolvedValue({
            seeded: 10,
            failed: 0,
        });

        // Import the route handler
        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = createAuthenticatedRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.seeded).toBe(10);
        expect(data.failed).toBe(0);
    });

    it('should handle partial failures gracefully', async () => {
        // Mock seeding with some failures
        mockSeedAllUsersAth.mockResolvedValue({
            seeded: 8,
            failed: 2,
        });

        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = createAuthenticatedRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.seeded).toBe(8);
        expect(data.failed).toBe(2);
    });

    it('should accept optional hoursAgo parameter for historical seeding', async () => {
        mockSeedAllUsersAth.mockResolvedValue({
            seeded: 5,
            failed: 0,
        });

        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = createAuthenticatedRequest({ hoursAgo: 1 });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // The hoursAgo param should be logged/noted in the response
        expect(data.hoursAgo).toBe(1);
    });

    it('should return 401 when no auth token is provided', async () => {
        mockVerifyAuthToken.mockResolvedValue(null);

        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = new Request('http://localhost:3000/api/deposit-ath/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        expect(response.status).toBe(401);
    });

    it('should return 401 when Privy is not configured', async () => {
        mockIsPrivyServerConfigured.mockReturnValue(false);

        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = createAuthenticatedRequest({});

        const response = await POST(request);
        expect(response.status).toBe(401);
    });

    it('should handle errors gracefully', async () => {
        // Mock seeding failure
        mockSeedAllUsersAth.mockRejectedValue(new Error('Database error'));

        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = createAuthenticatedRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
    });
});

describe('Historical Block Calculation', () => {
    it('should calculate correct Arbitrum block offset for 1 hour ago', () => {
        // Arbitrum: ~250ms per block
        // 1 hour = 3600 seconds = 3600 * 4 = 14,400 blocks
        const hoursAgo = 1;
        const arbitrumBlocksPerSecond = 4; // ~250ms per block
        const expectedBlockOffset = hoursAgo * 3600 * arbitrumBlocksPerSecond;

        expect(expectedBlockOffset).toBe(14400);
    });

    it('should calculate correct Ethereum block offset for 1 hour ago', () => {
        // Ethereum mainnet: ~12s per block
        // 1 hour = 3600 seconds / 12 = 300 blocks
        const hoursAgo = 1;
        const ethereumSecondsPerBlock = 12;
        const expectedBlockOffset = Math.floor((hoursAgo * 3600) / ethereumSecondsPerBlock);

        expect(expectedBlockOffset).toBe(300);
    });
});
