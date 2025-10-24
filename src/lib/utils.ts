import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(v?: number | string, opts?: { fallback?: string; maximumFractionDigits?: number }) {
  if (typeof v === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
    }).format(v);
  }
  return v ?? opts?.fallback ?? "-";
}

export const MASK_SHORT = "***";
export const MASK_LONG = "******";

export function maskString(value: string, showValues: boolean, mask: string = MASK_SHORT) {
  return showValues ? value : mask;
}

export function formatAddress(address: string | `0x${string}`): `0x${string}` {
  return address as `0x${string}`;
}
