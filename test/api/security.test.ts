/**
 * Security Tests - TDD for security audit fixes
 *
 * Tests that security vulnerabilities identified in the audit are fixed.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as fs from 'fs';

// ============================================================================
// C1: /api/deposit-ath/seed requires authentication
// ============================================================================
describe('C1: /api/deposit-ath/seed authentication', () => {
    const mockSeedAllUsersAth = vi.fn();
    const mockGetTotalCollateral = vi.fn();
    const mockVerifyAuth = vi.fn();
    const mockIsPrivyConfigured = vi.fn();

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        vi.doMock('@/lib/db/depositAthDb', () => ({
            seedAllUsersAth: mockSeedAllUsersAth,
        }));
        vi.doMock('@/lib/db/supabase', () => ({
            isSupabaseConfigured: vi.fn(() => true),
        }));
        vi.doMock('@/lib/collateral/multiProtocolCollateral', () => ({
            getTotalCollateralByAddress: mockGetTotalCollateral,
        }));
        vi.doMock('@/lib/auth/privy-server', () => ({
            verifyAuthToken: mockVerifyAuth,
            isPrivyServerConfigured: mockIsPrivyConfigured,
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return 401 when no auth token is provided', async () => {
        mockIsPrivyConfigured.mockReturnValue(true);
        mockVerifyAuth.mockResolvedValue(null);

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
        mockIsPrivyConfigured.mockReturnValue(false);

        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = new Request('http://localhost:3000/api/deposit-ath/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        expect(response.status).toBe(401);
    });

    it('should succeed with valid auth token', async () => {
        mockIsPrivyConfigured.mockReturnValue(true);
        mockVerifyAuth.mockResolvedValue({
            userId: 'admin_user',
            walletAddress: '0x1234567890123456789012345678901234567890',
        });
        mockSeedAllUsersAth.mockResolvedValue({ seeded: 5, failed: 0 });

        const { POST } = await import('@/app/api/deposit-ath/seed/route');

        const request = new Request('http://localhost:3000/api/deposit-ath/seed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer valid_token',
            },
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
    });
});

// ============================================================================
// C2: /api/debug/fluid requires authentication
// ============================================================================
describe('C2: /api/debug/fluid authentication', () => {
    const mockVerifyAuth2 = vi.fn();
    const mockIsPrivyConfigured2 = vi.fn();

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        vi.doMock('@/lib/auth/privy-server', () => ({
            verifyAuthToken: mockVerifyAuth2,
            isPrivyServerConfigured: mockIsPrivyConfigured2,
        }));
        vi.doMock('@/lib/config/abis', () => ({
            FLUID_VAULT_RESOLVER_ADDR: '0x1234567890123456789012345678901234567890',
        }));
        vi.doMock('@/lib/utils', () => ({
            formatAddress: (addr: string) => addr as `0x${string}`,
        }));
        vi.doMock('@/constants/addresses', () => ({
            ETHEREUM_TOKEN_ADDRESSES: {
                XAUT: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
                USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            },
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return 401 when no auth token is provided', async () => {
        mockIsPrivyConfigured2.mockReturnValue(true);
        mockVerifyAuth2.mockResolvedValue(null);

        const { GET } = await import('@/app/api/debug/fluid/route');

        const request = new Request('http://localhost:3000/api/debug/fluid?address=0x1234567890123456789012345678901234567890');

        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it('should return 401 when Privy is not configured', async () => {
        mockIsPrivyConfigured2.mockReturnValue(false);

        const { GET } = await import('@/app/api/debug/fluid/route');

        const request = new Request('http://localhost:3000/api/debug/fluid?address=0x1234567890123456789012345678901234567890');

        const response = await GET(request);
        expect(response.status).toBe(401);
    });
});

// ============================================================================
// Static file content checks (C4, C5, H2, H6, H7)
// ============================================================================
describe('Static security checks', () => {
    describe('C4: Supabase service key no fallback', () => {
        it('should not contain anon key fallback in referralDb', () => {
            const content = fs.readFileSync('src/lib/db/referralDb.ts', 'utf-8');
            expect(content).not.toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        });

        it('should not contain anon key fallback in depositAthDb', () => {
            const content = fs.readFileSync('src/lib/db/depositAthDb.ts', 'utf-8');
            expect(content).not.toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        });
    });

    describe('C5: No access token logging', () => {
        it('should not log access token in UserProvider', () => {
            const content = fs.readFileSync('src/providers/UserProvider.tsx', 'utf-8');
            expect(content).not.toMatch(/console\.log.*[Aa]ccess.*token/i);
        });
    });

    describe('H2: No PII logging in auth module', () => {
        it('should not log wallet addresses or user IDs in privy-server', () => {
            const content = fs.readFileSync('src/lib/auth/privy-server.ts', 'utf-8');
            expect(content).not.toMatch(/console\.log.*userId/);
            expect(content).not.toMatch(/console\.log.*[Ww]allet/);
            expect(content).not.toMatch(/console\.log.*LinkedAccounts/i);
        });
    });

    describe('H6: No signature logging', () => {
        it('should not log signature data in 0x route', () => {
            const content = fs.readFileSync('src/app/api/0x/route.ts', 'utf-8');
            expect(content).not.toMatch(/console\.log.*signature/i);
            expect(content).not.toMatch(/console\.log.*tradeSig/i);
            expect(content).not.toMatch(/console\.log.*approvalSig/i);
        });
    });

    describe('H7: Security headers configured', () => {
        it('should configure security headers in next.config.ts', () => {
            const content = fs.readFileSync('next.config.ts', 'utf-8');
            expect(content).toContain('headers');
            expect(content).toContain('X-Frame-Options');
            expect(content).toContain('X-Content-Type-Options');
            expect(content).toContain('Referrer-Policy');
        });
    });
});

// ============================================================================
// H1: Auth bypass eliminated
// ============================================================================
describe('H1: Auth bypass eliminated', () => {
    describe('POST /api/btc/deposit - fail closed', () => {
        const mockDeposit = vi.fn();
        const mockAuth3 = vi.fn();
        const mockPrivy3 = vi.fn();

        beforeEach(() => {
            vi.resetModules();
            vi.clearAllMocks();

            vi.doMock('@/lib/btc/depositService', () => ({
                depositService: { initiateDeposit: mockDeposit },
            }));
            vi.doMock('@/lib/auth/privy-server', () => ({
                verifyAuthToken: mockAuth3,
                isPrivyServerConfigured: mockPrivy3,
            }));
        });

        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllEnvs();
        });

        it('should return 401 in development when auth fails', async () => {
            vi.stubEnv('NODE_ENV', 'development');
            mockPrivy3.mockReturnValue(true);
            mockAuth3.mockResolvedValue(null);

            const { POST } = await import('@/app/api/btc/deposit/route');

            const request = new NextRequest('http://localhost/api/btc/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ btcAmount: '0.5', evmAddress: '0x1234567890123456789012345678901234567890' }),
            });

            const response = await POST(request);
            expect(response.status).toBe(401);
        });

        it('should return 401 when Privy is not configured', async () => {
            mockPrivy3.mockReturnValue(false);

            const { POST } = await import('@/app/api/btc/deposit/route');

            const request = new NextRequest('http://localhost/api/btc/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ btcAmount: '0.5', evmAddress: '0x1234567890123456789012345678901234567890' }),
            });

            const response = await POST(request);
            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/btc/withdraw - fail closed', () => {
        const mockWithdraw = vi.fn();
        const mockAuth4 = vi.fn();
        const mockPrivy4 = vi.fn();

        beforeEach(() => {
            vi.resetModules();
            vi.clearAllMocks();

            vi.doMock('@/lib/btc/withdrawalService', () => ({
                withdrawalService: { initiateWithdrawal: mockWithdraw },
            }));
            vi.doMock('@/lib/auth/privy-server', () => ({
                verifyAuthToken: mockAuth4,
                isPrivyServerConfigured: mockPrivy4,
            }));
        });

        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllEnvs();
        });

        it('should return 401 in development when auth fails', async () => {
            vi.stubEnv('NODE_ENV', 'development');
            mockPrivy4.mockReturnValue(true);
            mockAuth4.mockResolvedValue(null);

            const { POST } = await import('@/app/api/btc/withdraw/route');

            const request = new NextRequest('http://localhost/api/btc/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wbtcAmount: '0.5', btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' }),
            });

            const response = await POST(request);
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/referrals - fail closed', () => {
        const mockGetOrCreate = vi.fn();
        const mockGetStats = vi.fn();
        const mockGetUnclaimed = vi.fn();
        const mockAuth5 = vi.fn();
        const mockPrivy5 = vi.fn();

        beforeEach(() => {
            vi.resetModules();
            vi.clearAllMocks();

            vi.doMock('@/lib/db/referralDb', () => ({
                referralDb: {
                    getOrCreateUser: mockGetOrCreate,
                    getReferralStats: mockGetStats,
                    getUnclaimedEarnings: mockGetUnclaimed,
                },
            }));
            vi.doMock('@/lib/auth/privy-server', () => ({
                verifyAuthToken: mockAuth5,
                isPrivyServerConfigured: mockPrivy5,
            }));
        });

        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllEnvs();
        });

        it('should return 401 in development when auth fails', async () => {
            vi.stubEnv('NODE_ENV', 'development');
            mockPrivy5.mockReturnValue(true);
            mockAuth5.mockResolvedValue(null);

            const { GET } = await import('@/app/api/referrals/route');

            const request = new NextRequest('http://localhost:3000/api/referrals', {
                method: 'GET',
            });

            const response = await GET(request);
            expect(response.status).toBe(401);
        });

        it('should return 401 when Privy is not configured', async () => {
            mockPrivy5.mockReturnValue(false);

            const { GET } = await import('@/app/api/referrals/route');

            const request = new NextRequest('http://localhost:3000/api/referrals', {
                method: 'GET',
            });

            const response = await GET(request);
            expect(response.status).toBe(401);
        });
    });
});

// ============================================================================
// H5: External API error details not leaked
// ============================================================================
describe('H5: Error detail sanitization', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
        process.env = { ...originalEnv, OX_API_KEY: 'test-key' };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    it('should not include details field in 0x GET error response', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ reason: 'INTERNAL', stack: 'trace...' }),
        });

        const { GET } = await import('@/app/api/0x/route');

        const request = new NextRequest(
            'http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x1234567890123456789012345678901234567890'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(data.details).toBeUndefined();
    });

    it('should not include raw error text in 0x POST error response', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ reason: 'INVALID_SIG', internal: 'secret' }),
        });

        const { POST } = await import('@/app/api/0x/route');

        const request = new NextRequest('http://localhost/api/0x', {
            method: 'POST',
            body: JSON.stringify({ chainId: 42161, trade: {} }),
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.error).not.toContain('secret');
    });

    it('should not expose raw error.message in swap API errors', () => {
        const content = fs.readFileSync('src/app/api/swap/route.ts', 'utf-8');
        expect(content).not.toMatch(/error\.message/);
    });
});

// ============================================================================
// M3: Wallet address validation on referral join
// ============================================================================
describe('M3: Wallet address validation', () => {
    const mockJoin = vi.fn();

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        vi.doMock('@/lib/db/referralDb', () => ({
            referralDb: {
                joinReferral: mockJoin,
            },
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should reject invalid wallet address format', async () => {
        const { POST } = await import('@/app/api/referrals/join/route');

        const request = new Request('http://localhost:3000/api/referrals/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'STACK123', walletAddress: 'not-valid' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
    });

    it('should accept valid EVM address', async () => {
        mockJoin.mockResolvedValue(true);

        const { POST } = await import('@/app/api/referrals/join/route');

        const request = new Request('http://localhost:3000/api/referrals/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'STACK123', walletAddress: '0x1234567890123456789012345678901234567890' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
    });
});
