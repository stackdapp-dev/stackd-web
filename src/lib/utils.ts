import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function abbreviateNumber(num: number, decimals: number): string {
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixIndex = 0;
  let absNum = Math.abs(num);
  while (absNum >= 1000 && suffixIndex < suffixes.length - 1) {
    absNum /= 1000;
    suffixIndex++;
  }
  return (
    (num < 0 ? "-" : "") + absNum.toFixed(decimals) + suffixes[suffixIndex]
  );
}

export function formatAmount(
  value: number | null | undefined,
  decimals: number = 6
) {
  if (value === null || value === undefined) return `0`;
  const num = Number(value);
  const abs = Math.abs(num);
  // Tiny positive numbers: show '< 0.0001' for values > 0 and < 0.0001
  if (abs > 0 && abs < 0.0001) return `< 0.0001`;
  // Cap maximum decimals to 4 to avoid very long fractional displays
  const maxDecimals = Math.min(4, Math.max(0, decimals));
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatCurrency(
  value: number | null | undefined,
  decimals: number = 2,
  currencySymbol: string = "$",
  abbreviate: boolean = true
) {
  if (value === null || value === undefined) return `$0`;
  const num = Number(value);
  // For large numbers, abbreviate (e.g., 6.11K, 7.1M). Use 1 decimal place for abbreviated values.
  const abs = Math.abs(num);
  if (abs >= 1000 && abbreviate) {
    return `${currencySymbol}${abbreviateNumber(num, 1)}`;
  }
  // For smaller numbers, show with requested decimals (no grouping abbreviation)
  return `${currencySymbol}${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatPercent(
  value: number | null | undefined,
  decimals: number = 2
) {
  if (value === null || value === undefined) return `0%`;
  return `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export const MASK_SHORT = "***";
export const MASK_LONG = "******";

export function maskString(
  value: string,
  showValues: boolean,
  mask: string = MASK_SHORT
) {
  return showValues ? value : mask;
}

export function formatAddress(address: string | `0x${string}`): `0x${string}` {
  return address as `0x${string}`;
}

/**
 * Formats a date string to mm/dd/yy hh:mm format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}
