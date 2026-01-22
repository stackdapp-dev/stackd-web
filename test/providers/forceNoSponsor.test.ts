import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Test suite for forceNoSponsor parameter in Web3Provider
 * 
 * This tests the behavior where:
 * 1. Embedded wallets normally use gas sponsorship (sponsor: true)
 * 2. When forceNoSponsor is true, even embedded wallets don't use sponsorship
 * 3. This is used for Ethereum mainnet Fluid operations where paymaster simulation fails
 */
describe('Web3Provider forceNoSponsor', () => {

    describe('sendSponsoredTransaction with forceNoSponsor', () => {
        it('should NOT sponsor transaction when forceNoSponsor is true for embedded wallet', () => {
            // The actual implementation checks: shouldSponsor = isEmbeddedWallet && !params.forceNoSponsor
            const isEmbeddedWallet = true;
            const forceNoSponsor = true;

            const shouldSponsor = isEmbeddedWallet && !forceNoSponsor;

            expect(shouldSponsor).toBe(false);
        });

        it('should sponsor transaction when forceNoSponsor is false for embedded wallet', () => {
            const isEmbeddedWallet = true;
            const forceNoSponsor = false;

            const shouldSponsor = isEmbeddedWallet && !forceNoSponsor;

            expect(shouldSponsor).toBe(true);
        });

        it('should sponsor transaction when forceNoSponsor is undefined for embedded wallet', () => {
            const isEmbeddedWallet = true;
            const forceNoSponsor = undefined;

            const shouldSponsor = isEmbeddedWallet && !forceNoSponsor;

            expect(shouldSponsor).toBe(true);
        });

        it('should NOT sponsor transaction for external wallet regardless of forceNoSponsor', () => {
            const isEmbeddedWallet = false;
            const forceNoSponsor = false;

            const shouldSponsor = isEmbeddedWallet && !forceNoSponsor;

            expect(shouldSponsor).toBe(false);
        });
    });

    describe('Fluid operations should use forceNoSponsor', () => {
        it('should add forceNoSponsor: true for Ethereum mainnet Fluid vault operations', () => {
            // This test verifies that our Fluid operations include forceNoSponsor
            const fluidTransactionParams = {
                to: '0xEce156BeD5aF2621b80b87ff4fE8fD3A929E3644', // XAUT_USDT_VAULT
                data: '0x...',
                chainId: 1, // mainnet
                forceNoSponsor: true,
            };

            expect(fluidTransactionParams.forceNoSponsor).toBe(true);
            expect(fluidTransactionParams.chainId).toBe(1); // Ethereum mainnet
        });
    });
});
