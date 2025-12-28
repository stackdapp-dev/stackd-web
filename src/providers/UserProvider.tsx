"use client";

import { getUserPaymentMethods, UserPaymentMethod } from "@/lib/api/user";
import { usePrivy } from "@privy-io/react-auth";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { getStoredReferralCode, clearStoredReferralCode } from "@/hooks/useReferralGate";
import { useWallets } from "@privy-io/react-auth";

/**
 * Define the shape of your context value
 */
type UserContextValue = {
  paymentMethods: UserPaymentMethod[];
  getAccessToken: () => Promise<string | null>;
  refetchPaymentMethods: () => Promise<void>;
};

/**
 * Create the context with undefined as initial value
 */
const UserContext = createContext<UserContextValue | undefined>(undefined);

/**
 * Provider component props
 */
interface UserProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { getAccessToken, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const referralLinked = useRef(false);

  useEffect(() => {
    if (!authenticated) return;

    const fetchUserResources = async () => {
      const accessToken = await getAccessToken();
      console.log("Access token:", accessToken);
      if (!accessToken) {
        console.error("Failed to fetch Privy access token");
        return;
      }

      const data = await getUserPaymentMethods(accessToken);
      if (data) {
        setPaymentMethods(data);
      }
    };
    fetchUserResources();
  }, [authenticated, getAccessToken]);

  // Link referral after authentication (runs once)
  useEffect(() => {
    if (!authenticated || referralLinked.current) return;

    const linkReferral = async () => {
      const storedCode = getStoredReferralCode();
      if (!storedCode) return;

      // Get wallet address from Privy
      const wallet = wallets[0];
      if (!wallet?.address) return;

      try {
        const response = await fetch('/api/referrals/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: storedCode,
            walletAddress: wallet.address,
          }),
        });

        if (response.ok) {
          console.log('[UserProvider] Successfully linked referral:', storedCode);
          clearStoredReferralCode();
        } else {
          console.warn('[UserProvider] Failed to link referral:', await response.text());
        }
      } catch (error) {
        console.error('[UserProvider] Error linking referral:', error);
      }

      referralLinked.current = true;
    };

    linkReferral();
  }, [authenticated, wallets]);

  const refetchPaymentMethods = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    const data = await getUserPaymentMethods(accessToken);
    if (data) {
      setPaymentMethods(data);
    }
  };

  // Context value
  const value: UserContextValue = {
    paymentMethods,
    getAccessToken,
    refetchPaymentMethods,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Custom hook to use the context
 * Throws an error if used outside of provider
 */
export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserProvider;
