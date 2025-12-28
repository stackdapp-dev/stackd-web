/**
 * Privy Server-Side Authentication
 * 
 * Verifies access tokens from the client and extracts user info.
 * Environment variables required:
 * - PRIVY_APP_ID (same as NEXT_PUBLIC_PRIVY_APP_ID)
 * - PRIVY_APP_SECRET (from Privy dashboard)
 */

import { PrivyClient } from '@privy-io/server-auth';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const privyAppSecret = process.env.PRIVY_APP_SECRET;

// Lazy initialization to avoid errors when env vars are missing
let _privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient | null {
    if (!privyAppId || !privyAppSecret) {
        return null;
    }
    if (!_privyClient) {
        _privyClient = new PrivyClient(privyAppId, privyAppSecret);
    }
    return _privyClient;
}

export interface AuthenticatedUser {
    userId: string; // Privy DID
    walletAddress: string | null;
}

/**
 * Verify the access token from the Authorization header
 * Returns the authenticated user or null if invalid
 */
export async function verifyAuthToken(request: Request): Promise<AuthenticatedUser | null> {
    const privy = getPrivyClient();
    if (!privy) {
        return null;
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
        // Verify the token with Privy
        const verifiedClaims = await privy.verifyAuthToken(token);

        // Get user data to find wallet address
        const user = await privy.getUser(verifiedClaims.userId);

        // Find the wallet address (prefer embedded, then external)
        let walletAddress: string | null = null;

        if (user.wallet?.address) {
            walletAddress = user.wallet.address;
        } else if (user.linkedAccounts) {
            const walletAccount = user.linkedAccounts.find(
                (account: any) => account.type === 'wallet'
            );
            if (walletAccount && 'address' in walletAccount) {
                walletAddress = walletAccount.address as string;
            }
        }

        return {
            userId: verifiedClaims.userId,
            walletAddress,
        };
    } catch (error) {
        console.error('[Auth] Token verification failed:', error);
        return null;
    }
}

/**
 * Check if Privy server auth is configured
 */
export function isPrivyServerConfigured(): boolean {
    return Boolean(privyAppId && privyAppSecret);
}
