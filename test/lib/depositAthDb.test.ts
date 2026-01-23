/**
 * Deposit ATH Database Service Tests
 *
 * Tests for the All-Time High deposit tracking service.
 * Following TDD: these tests are written before the implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockFrom, mockSelect, mockInsert, mockUpdate } = vi.hoisted(() => {
    return {
        mockFrom: vi.fn(),
        mockSelect: vi.fn(),
        mockInsert: vi.fn(),
        mockUpdate: vi.fn(),
    };
});

// Mock the isSupabaseConfigured function
vi.mock('@/lib/db/supabase', () => ({
    isSupabaseConfigured: vi.fn(() => true),
}));

// Mock createClient with hoisted mock
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: mockFrom,
    })),
}));

// Import after mocks are set up
import {
    updateAthIfHigher,
    getTopAthDepositors,
    getAthByWallet,
} from '@/lib/db/depositAthDb';

describe('depositAthDb', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFrom.mockReset();
        mockSelect.mockReset();
        mockInsert.mockReset();
        mockUpdate.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('updateAthIfHigher', () => {
        it('should insert new ATH record for wallet with no existing record', async () => {
            const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const collateral = {
                totalCollateralUsd: 1000,
                compoundCollateralUsd: 600,
                fluidCollateralUsd: 400,
            };

            // Mock: no existing record
            const selectSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
            const selectEqMock = vi.fn().mockReturnValue({ single: selectSingleMock });
            mockSelect.mockReturnValue({ eq: selectEqMock });

            // Mock: successful insert
            const insertSelectSingleMock = vi.fn().mockResolvedValue({
                data: {
                    wallet_address: walletAddress.toLowerCase(),
                    ath_usd: 1000,
                    ath_compound_usd: 600,
                    ath_fluid_usd: 400,
                },
                error: null,
            });
            const insertSelectMock = vi.fn().mockReturnValue({ single: insertSelectSingleMock });
            mockInsert.mockReturnValue({ select: insertSelectMock });

            mockFrom.mockImplementation(() => ({
                select: mockSelect,
                insert: mockInsert,
            }));

            const result = await updateAthIfHigher(walletAddress, collateral);

            expect(result).not.toBeNull();
            expect(result?.ath_usd).toBe(1000);
        });

        it('should update ATH when current collateral exceeds stored ATH', async () => {
            const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const collateral = {
                totalCollateralUsd: 2000, // Higher than existing 1000
                compoundCollateralUsd: 1200,
                fluidCollateralUsd: 800,
            };

            // Mock: existing record with lower ATH
            const selectSingleMock = vi.fn().mockResolvedValue({
                data: {
                    id: 'existing-id',
                    wallet_address: walletAddress.toLowerCase(),
                    ath_usd: 1000,
                    ath_compound_usd: 600,
                    ath_fluid_usd: 400,
                },
                error: null,
            });
            const selectEqMock = vi.fn().mockReturnValue({ single: selectSingleMock });
            mockSelect.mockReturnValue({ eq: selectEqMock });

            // Mock: successful update
            const updateSelectSingleMock = vi.fn().mockResolvedValue({
                data: {
                    wallet_address: walletAddress.toLowerCase(),
                    ath_usd: 2000,
                    ath_compound_usd: 1200,
                    ath_fluid_usd: 800,
                },
                error: null,
            });
            const updateSelectMock = vi.fn().mockReturnValue({ single: updateSelectSingleMock });
            const updateEqMock = vi.fn().mockReturnValue({ select: updateSelectMock });
            mockUpdate.mockReturnValue({ eq: updateEqMock });

            mockFrom.mockImplementation(() => ({
                select: mockSelect,
                update: mockUpdate,
            }));

            const result = await updateAthIfHigher(walletAddress, collateral);

            expect(result).not.toBeNull();
            expect(result?.ath_usd).toBe(2000);
        });

        it('should NOT update ATH when current collateral is lower than stored ATH', async () => {
            const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const collateral = {
                totalCollateralUsd: 500, // Lower than existing 1000
                compoundCollateralUsd: 300,
                fluidCollateralUsd: 200,
            };

            const existingAth = {
                id: 'existing-id',
                wallet_address: walletAddress.toLowerCase(),
                ath_usd: 1000,
                ath_compound_usd: 600,
                ath_fluid_usd: 400,
            };

            // Mock: existing record with higher ATH
            const selectSingleMock = vi.fn().mockResolvedValue({
                data: existingAth,
                error: null,
            });
            const selectEqMock = vi.fn().mockReturnValue({ single: selectSingleMock });
            mockSelect.mockReturnValue({ eq: selectEqMock });

            mockFrom.mockImplementation(() => ({
                select: mockSelect,
            }));

            const result = await updateAthIfHigher(walletAddress, collateral);

            // Should return existing ATH, not updated
            expect(result).not.toBeNull();
            expect(result?.ath_usd).toBe(1000); // Original value preserved
        });
    });

    describe('getTopAthDepositors', () => {
        it('should return top depositors sorted by ATH descending', async () => {
            const mockDepositors = [
                { wallet_address: '0xaaa', ath_usd: 50000 },
                { wallet_address: '0xbbb', ath_usd: 30000 },
                { wallet_address: '0xccc', ath_usd: 10000 },
            ];

            const limitMock = vi.fn().mockResolvedValue({
                data: mockDepositors,
                error: null,
            });
            const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
            mockSelect.mockReturnValue({ order: orderMock });

            mockFrom.mockImplementation(() => ({
                select: mockSelect,
            }));

            const result = await getTopAthDepositors(10);

            expect(result).toHaveLength(3);
            expect(result[0].wallet_address).toBe('0xaaa');
            expect(result[0].ath_usd).toBe(50000);
            expect(result[1].ath_usd).toBe(30000);
            expect(result[2].ath_usd).toBe(10000);
        });

        it('should return empty array when no depositors exist', async () => {
            const limitMock = vi.fn().mockResolvedValue({
                data: [],
                error: null,
            });
            const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
            mockSelect.mockReturnValue({ order: orderMock });

            mockFrom.mockImplementation(() => ({
                select: mockSelect,
            }));

            const result = await getTopAthDepositors(10);

            expect(result).toHaveLength(0);
        });
    });

    describe('getAthByWallet', () => {
        it('should return ATH record for existing wallet', async () => {
            const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const mockAth = {
                id: 'test-id',
                wallet_address: walletAddress.toLowerCase(),
                ath_usd: 5000,
                ath_compound_usd: 3000,
                ath_fluid_usd: 2000,
            };

            const selectSingleMock = vi.fn().mockResolvedValue({
                data: mockAth,
                error: null,
            });
            const selectEqMock = vi.fn().mockReturnValue({ single: selectSingleMock });
            mockSelect.mockReturnValue({ eq: selectEqMock });

            mockFrom.mockImplementation(() => ({
                select: mockSelect,
            }));

            const result = await getAthByWallet(walletAddress);

            expect(result).not.toBeNull();
            expect(result?.ath_usd).toBe(5000);
        });

        it('should return null for non-existent wallet', async () => {
            const walletAddress = '0xnonexistent';

            const selectSingleMock = vi.fn().mockResolvedValue({
                data: null,
                error: null,
            });
            const selectEqMock = vi.fn().mockReturnValue({ single: selectSingleMock });
            mockSelect.mockReturnValue({ eq: selectEqMock });

            mockFrom.mockImplementation(() => ({
                select: mockSelect,
            }));

            const result = await getAthByWallet(walletAddress);

            expect(result).toBeNull();
        });
    });
});
