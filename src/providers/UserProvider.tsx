"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createContext, useContext, useEffect, useState } from "react";
import { zeroAddress } from "viem";

/**
 * Define the shape of your context value
 */
type UserContextValue = {
  walletAddress: string;
  profile: {
    userId: string;
    privyId: string;
    email: string;
  };
  paymentMethods: {
    type: "bank" | "e-wallet";
    accountName: string;
    email: string;
    phoneNumber: string;
    bankName: string;
    bankAccountNumber: string;
    alias: string;
  }[];
  getAccessToken: () => Promise<string | null>;
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
  const walletAddress = wallets.length > 0 ? wallets[0].address : zeroAddress;

  const [profile, setProfile] = useState({
    userId: "",
    privyId: "",
    email: "",
  });

  useEffect(() => {
    if (!authenticated) return;

    const fetchProfile = async () => {
      const accessToken = await getAccessToken();
      console.log("Access token:", accessToken);
      if (!accessToken) {
        console.error("Failed to fetch Privy access token");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_TOKEN_PRICE_API_BASE_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch user profile:", response);
        return;
      }

      const data = await response.json();
      setProfile(data);
      return data;
    };
    fetchProfile();
  }, [authenticated, getAccessToken]);

  // Context value
  const value: UserContextValue = {
    walletAddress,
    profile,
    paymentMethods: [],
    getAccessToken,
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
