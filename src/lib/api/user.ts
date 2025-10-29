import { baseUrl } from "./config";

export type UserProfile = {
  id: string;
  privyId: string;
  email: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
};

export type UserPaymentMethod = {
  id: string;
  type: "bank" | "e-wallet";
  accountName: string;
  email: string;
  phoneNumber: string;
  bankName: string;
  bankAccountNumber: string;
  alias: string;
};

export const getUserProfile = async (accessToken: string) => {
  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch user profile:", response);
    return null;
  }

  const data = await response.json();

  return data as UserProfile;
};

export const getUserPaymentMethods = async (accessToken: string) => {
  const response = await fetch(`${baseUrl}/payment-methods`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch user payment methods:", response);
    return null;
  }

  const data = await response.json();

  return data.paymentMethodsRoutes as UserPaymentMethod[];
};
