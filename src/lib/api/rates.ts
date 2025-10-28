/**
 * API library for fetching exchange rates
 */

import { baseUrl } from "./config";

export interface RateData {
  data: string;
  updatedAt: string;
}

export interface RatesResponse {
  fromCurrency: string;
  data: {
    [currency: string]: RateData;
  };
}

/**
 * Fetches the latest exchange rate for a given currency pair
 * @param fromCurrency - The source currency (e.g., "usdt")
 * @param toCurrency - The target currency (e.g., "PHP")
 * @returns Promise with the rate data
 * @throws Error if the API request fails
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<RateData> {
  try {
    const response = await fetch(
      `${baseUrl}/rates/${fromCurrency.toLowerCase()}/latest`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`);
    }

    const data: RatesResponse = await response.json();

    if (!data.data[toCurrency]) {
      throw new Error(`${toCurrency} rate not found in response`);
    }

    return data.data[toCurrency];
  } catch (error) {
    console.error(
      `Error fetching ${fromCurrency} to ${toCurrency} rate:`,
      error
    );
    throw error;
  }
}

/**
 * Fetches the exchange rate and returns just the numeric value
 * @param fromCurrency - The source currency (e.g., "usdt")
 * @param toCurrency - The target currency (e.g., "PHP")
 * @returns Promise with the rate as a number
 */
export async function getExchangeRateValue(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rateData = await getExchangeRate(fromCurrency, toCurrency);
  return parseFloat(rateData.data);
}

/**
 * Converts an amount from one currency to another using the latest rate
 * @param amount - Amount in the source currency
 * @param fromCurrency - The source currency (e.g., "usdt")
 * @param toCurrency - The target currency (e.g., "PHP")
 * @returns Promise with the converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRateValue(fromCurrency, toCurrency);
  return amount * rate;
}
