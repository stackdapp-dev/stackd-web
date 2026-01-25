/**
 * User API Tests
 *
 * Tests for user-related API functions including payment methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserPaymentMethods, getUserProfile } from '@/lib/api/user';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('getUserPaymentMethods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('returns payment methods on successful response', async () => {
        // Arrange
        const mockPaymentMethods = [
            {
                id: '1',
                type: 'bank' as const,
                accountName: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                bankName: 'Test Bank',
                bankAccountNumber: '1234567890',
            },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockPaymentMethods }),
        });

        // Act
        const result = await getUserPaymentMethods('test-token');

        // Assert
        expect(result).toEqual(mockPaymentMethods);
        expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('returns null and does NOT call console.error on API failure', async () => {
        // Arrange - API returns non-ok response (e.g., 401, 500, etc.)
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
        });

        // Act
        const result = await getUserPaymentMethods('invalid-token');

        // Assert
        expect(result).toBeNull();
        // IMPORTANT: Should NOT call console.error to avoid triggering Next.js error overlay
        expect(mockConsoleError).not.toHaveBeenCalled();
        // Should use console.warn instead for non-blocking logging
        expect(mockConsoleWarn).toHaveBeenCalledWith(
            'Failed to fetch user payment methods:',
            401  // Logs status code instead of full response object
        );
    });

    it('returns null and uses console.warn on network error', async () => {
        // Arrange - Network error (fetch rejects)
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        // Act
        const result = await getUserPaymentMethods('test-token');

        // Assert
        expect(result).toBeNull();
        // Should NOT call console.error
        expect(mockConsoleError).not.toHaveBeenCalled();
    });
});

describe('getUserProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns user profile on successful response', async () => {
        // Arrange
        const mockProfile = {
            id: 'user_123',
            privyId: 'privy_123',
            email: 'user@example.com',
            walletAddress: '0x123',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: mockProfile }),
        });

        // Act
        const result = await getUserProfile('test-token');

        // Assert
        expect(result).toEqual(mockProfile);
    });

    it('returns null and does NOT call console.error on API failure', async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Act
        const result = await getUserProfile('test-token');

        // Assert
        expect(result).toBeNull();
        // Should NOT call console.error to avoid triggering Next.js error overlay
        expect(mockConsoleError).not.toHaveBeenCalled();
    });
});
