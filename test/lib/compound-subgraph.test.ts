/**
 * TDD Tests for Compound Subgraph Service
 *
 * Tests the service that queries Compound v3 subgraph for top depositors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import {
    getTopDepositors,
    type DepositorData,
} from '@/lib/compound/subgraph';

describe('Compound Subgraph Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getTopDepositors', () => {
        const mockSubgraphResponse = {
            data: {
                positions: [
                    {
                        account: { id: '0xabc123' },
                        accounting: {
                            collateralBalanceUsd: '150000.50',
                        },
                    },
                    {
                        account: { id: '0xdef456' },
                        accounting: {
                            collateralBalanceUsd: '75000.25',
                        },
                    },
                    {
                        account: { id: '0xghi789' },
                        accounting: {
                            collateralBalanceUsd: '50000.00',
                        },
                    },
                ],
            },
        };

        it('should fetch top depositors from subgraph', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSubgraphResponse,
            });

            const result = await getTopDepositors(10);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(3);
        });

        it('should return depositors sorted by collateral USD descending', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSubgraphResponse,
            });

            const result = await getTopDepositors(10);

            expect(result[0].totalDepositsUsd).toBe(150000.50);
            expect(result[1].totalDepositsUsd).toBe(75000.25);
            expect(result[2].totalDepositsUsd).toBe(50000.00);
        });

        it('should normalize wallet addresses to lowercase', async () => {
            const mixedCaseResponse = {
                data: {
                    positions: [
                        {
                            account: { id: '0xAbC123DeF456' },
                            accounting: {
                                collateralBalanceUsd: '100000.00',
                            },
                        },
                    ],
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mixedCaseResponse,
            });

            const result = await getTopDepositors(10);

            expect(result[0].walletAddress).toBe('0xabc123def456');
        });

        it('should respect the limit parameter', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSubgraphResponse,
            });

            await getTopDepositors(5);

            // Check that the GraphQL query includes the limit
            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            expect(body.query).toContain('first: 5');
        });

        it('should filter out positions with zero collateral', async () => {
            const responseWithZero = {
                data: {
                    positions: [
                        {
                            account: { id: '0xabc123' },
                            accounting: {
                                collateralBalanceUsd: '100000.00',
                            },
                        },
                        {
                            account: { id: '0xzero' },
                            accounting: {
                                collateralBalanceUsd: '0',
                            },
                        },
                    ],
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => responseWithZero,
            });

            const result = await getTopDepositors(10);

            expect(result).toHaveLength(1);
            expect(result[0].walletAddress).toBe('0xabc123');
        });

        it('should return empty array when subgraph returns no data', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: { positions: [] } }),
            });

            const result = await getTopDepositors(10);

            expect(result).toEqual([]);
        });

        it('should handle subgraph API errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            const result = await getTopDepositors(10);

            expect(result).toEqual([]);
        });

        it('should handle network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await getTopDepositors(10);

            expect(result).toEqual([]);
        });

        it('should handle malformed response gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ invalid: 'response' }),
            });

            const result = await getTopDepositors(10);

            expect(result).toEqual([]);
        });

        it('should include correct data structure for each depositor', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSubgraphResponse,
            });

            const result = await getTopDepositors(10);

            expect(result[0]).toEqual({
                walletAddress: '0xabc123',
                totalDepositsUsd: 150000.50,
            });
        });
    });

    describe('subgraph query structure', () => {
        it('should query the correct subgraph endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: { positions: [] } }),
            });

            await getTopDepositors(10);

            const callArgs = mockFetch.mock.calls[0];
            const url = callArgs[0];

            // Should use The Graph gateway or a configured endpoint
            expect(url).toContain('thegraph.com');
        });

        it('should send a POST request with GraphQL query', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: { positions: [] } }),
            });

            await getTopDepositors(10);

            const callArgs = mockFetch.mock.calls[0];
            expect(callArgs[1].method).toBe('POST');
            expect(callArgs[1].headers['Content-Type']).toBe('application/json');
        });

        it('should query positions ordered by collateral balance', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: { positions: [] } }),
            });

            await getTopDepositors(10);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            // Query should order by collateral balance descending
            expect(body.query).toContain('orderBy');
            expect(body.query).toContain('orderDirection: desc');
        });
    });
});
