"use client";

import {
  getUserPaymentMethods,
  getUserProfile,
  UserPaymentMethod,
  UserProfile,
} from "@/lib/api/user";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createContext, useContext, useEffect, useState } from "react";
import { zeroAddress } from "viem";

/**
 * Define the shape of your context value
 */
type UserContextValue = {
  walletAddress: string;
  profile: UserProfile;
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
  const walletAddress = wallets.length > 0 ? wallets[0].address : zeroAddress;

  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    privyId: "",
    email: "",
    walletAddress: "",
    createdAt: "",
    updatedAt: "",
  });
  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethod[]>([]);

  useEffect(() => {
    if (!authenticated) return;

    const getchUserResources = async () => {
      const accessToken = await getAccessToken();
      console.log("Access token:", accessToken);
      if (!accessToken) {
        console.error("Failed to fetch Privy access token");
        return;
      }

      const data = await Promise.all([
        getUserProfile(accessToken),
        getUserPaymentMethods(accessToken),
      ]);

      if (data[0]) {
        setProfile(data[0]);
      }

      if (data[1]) {
        setPaymentMethods(data[1]);
      }
    };
    getchUserResources();
  }, [authenticated, getAccessToken]);

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
    walletAddress,
    profile,
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
