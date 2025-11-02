import { TOKEN_METADATA } from "@/constants/Tokens";
import { parseUnits } from "viem";
import { baseUrl } from "./config";

type CreateOrderDetails = {
  cryptoAmount: string;
  fiatAmount: string;
  transferHash: string;
  paymentMethodId?: string;
  paymentMethodMetadata?: string;
};

export const createOrder = async (
  accessToken: string,
  orderDetails: CreateOrderDetails
) => {
  console.log("Payment method details:", orderDetails);
  const payload: {
    crypto: string;
    cryptoAmount: number;
    fiat: string;
    fiatAmount: number;
    transferHash: string;
    paymentMethodId?: string;
    paymentMethodMetadata?: string;
  } = {
    crypto: "USDT",
    cryptoAmount: Number(
      parseUnits(orderDetails.cryptoAmount, TOKEN_METADATA["USDT"].decimals)
    ),
    fiat: "PHP",
    fiatAmount: Number(orderDetails.fiatAmount),
    transferHash: orderDetails.transferHash,
  };

  if (orderDetails.paymentMethodId) {
    payload.paymentMethodId = orderDetails.paymentMethodId;
  } else if (orderDetails.paymentMethodMetadata) {
    payload.paymentMethodMetadata = orderDetails.paymentMethodMetadata;
  }

  const body = JSON.stringify(payload);
  console.log("Stringify:", body);
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = await response.json();

  if (!response.ok) {
    console.error("Failed to create order:", json);
    throw new Error(json.message);
  }

  return json.data;
};
