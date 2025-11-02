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
  bankName?: string;
  bankAccountNumber?: string;
  eWalletName?: string;
  alias?: string;
};

export type UserPaymentMethodInput = Omit<UserPaymentMethod, "id">;

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

  const json = await response.json();

  return json.user as UserProfile;
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

  const json = await response.json();

  return json.data as UserPaymentMethod[];
};

export const addUserPaymentMethod = async (
  accessToken: string,
  paymentMethodDetails: { [key: string]: string }
) => {
  console.log("Payment method details:", paymentMethodDetails);
  const body = JSON.stringify(paymentMethodDetails);
  console.log("Stringify:", body);
  const response = await fetch(`${baseUrl}/payment-methods`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = await response.json();

  if (!response.ok) {
    console.error("Failed to add user payment method:", response);
    throw new Error(json.message);
  }

  return json.data as UserPaymentMethod;
};
