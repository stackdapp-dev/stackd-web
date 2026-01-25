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
  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // Use console.warn instead of console.error to avoid triggering Next.js error overlay
      console.warn("Failed to fetch user profile:", response.status);
      return null;
    }

    const json = await response.json();

    return json.user as UserProfile;
  } catch (error) {
    // Network errors - use warn to avoid error overlay
    console.warn("Failed to fetch user profile:", error);
    return null;
  }
};

export const getUserPaymentMethods = async (accessToken: string) => {
  try {
    const response = await fetch(`${baseUrl}/payment-methods`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // Use console.warn instead of console.error to avoid triggering Next.js error overlay
      console.warn("Failed to fetch user payment methods:", response.status);
      return null;
    }

    const json = await response.json();

    return json.data as UserPaymentMethod[];
  } catch (error) {
    // Network errors - use warn to avoid error overlay
    console.warn("Failed to fetch user payment methods:", error);
    return null;
  }
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

export const deleteUserPaymentMethod = async (
  accessToken: string,
  id: string
) => {
  const body = JSON.stringify({ id });

  const response = await fetch(`${baseUrl}/payment-methods`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body,
  });

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    // ignore JSON parse errors
  }

  if (!response.ok) {
    console.error("Failed to delete user payment method:", response, json);
    throw new Error(json?.message || "Failed to delete payment method");
  }
  console.log("Successfully deleted payment method");

  return json?.data ?? true;
};
