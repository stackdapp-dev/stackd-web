export const baseUrl = process.env.NEXT_PUBLIC_TOKEN_PRICE_API_BASE_URL;
export const arbiscanUrl = process.env.NEXT_PUBLIC_ARBISCAN_URL || "https://arbiscan.io";
if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_TOKEN_PRICE_API_BASE_URL is not defined");
}
