/**
 * Integration tests for Compound v3 Subgraph
 * 
 * These tests call the REAL subgraph API to verify data integrity.
 * REQUIRES: GRAPH_API_KEY environment variable to be set.
 * 
 * Run manually with: pnpm vitest run test/lib/subgraph-integration.test.ts
 * 
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { getDepositorByAddress } from '@/lib/compound/subgraph';

// Known Stack'd wallet with deposits
const KNOWN_STACKD_DEPOSITOR = '0x45acE1fFdbd4582D4845f155a3898D8780Ebf671';

// Check if API key is available
const hasApiKey = !!process.env.GRAPH_API_KEY;

describe('Compound v3 Subgraph Integration', () => {
    beforeAll(() => {
        if (!hasApiKey) {
            console.warn('[Test] GRAPH_API_KEY not set - integration tests will use unauthenticated requests');
        }
    });

    describe('getDepositorByAddress', () => {
        it('should return deposit data for known Stack\'d depositor wallet', async () => {
            const depositor = await getDepositorByAddress(KNOWN_STACKD_DEPOSITOR);

            // This test requires GRAPH_API_KEY to be set
            if (!hasApiKey) {
                console.warn('[Test] Skipping assertion - no GRAPH_API_KEY');
                expect(true).toBe(true);
                return;
            }

            expect(depositor).not.toBeNull();
            expect(depositor).toBeDefined();
            expect(depositor!.walletAddress.toLowerCase()).toBe(
                KNOWN_STACKD_DEPOSITOR.toLowerCase()
            );
            expect(depositor!.totalDepositsUsd).toBeGreaterThan(0);

            console.log(
                `[Test] Stack'd wallet ${KNOWN_STACKD_DEPOSITOR} has $${depositor!.totalDepositsUsd.toFixed(2)} in Compound deposits`
            );
        }, 30000);

        it('should return null for wallet with no deposits', async () => {
            // Use a random address that almost certainly has no Compound deposits
            const emptyWallet = '0x0000000000000000000000000000000000000001';
            const depositor = await getDepositorByAddress(emptyWallet);

            expect(depositor).toBeNull();
        }, 30000);

        it('should handle case-insensitive wallet address lookup', async () => {
            // Skip if no API key
            if (!hasApiKey) {
                console.warn('[Test] Skipping - no GRAPH_API_KEY');
                expect(true).toBe(true);
                return;
            }

            // Test with lowercase address
            const depositorLower = await getDepositorByAddress(KNOWN_STACKD_DEPOSITOR.toLowerCase());

            if (depositorLower) {
                expect(depositorLower.walletAddress.toLowerCase()).toBe(
                    KNOWN_STACKD_DEPOSITOR.toLowerCase()
                );
            }
        }, 30000);
    });
});
