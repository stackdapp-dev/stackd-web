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
  if (!Number.isFinite(num)) return `0`;
  const abs = Math.abs(num);
  // Tiny positive numbers: show '< 0.0001' for values > 0 and < 0.0001
  if (abs > 0 && abs < 0.0001) return `< 0.0001`;
  // Cap maximum decimals to 4 to avoid very long fractional displays
  const maxDecimals = Math.min(4, Math.max(0, decimals));
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatCurrency(
  value: number | null | undefined,
  decimals: number = 2,
  currencySymbol: string = "$",
  abbreviate: boolean = true
) {
  if (value === null || value === undefined) return `${currencySymbol}0`;
  const num = Number(value);
  if (!Number.isFinite(num)) return `${currencySymbol}0`;
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
  const num = Number(value);
  if (!Number.isFinite(num)) return `0%`;
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

/**
 * Shortens a wallet address for display purposes
 * @param address - The full wallet address (0x...)
 * @param chars - Number of characters to show at the start and end (default: 4)
 * @returns Shortened address (e.g., "0x1234...5678")
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(
    address.length - chars
  )}`;
}

/**
 * Gets a human-readable identifier from a Privy user object.
 * Prioritizes identifiers in the following order:
 * 1. Email address
 * 2. Phone number
 * 3. Google account email
 * 4. Twitter username
 * 5. Discord username
 * 6. GitHub username
 * 7. Farcaster username
 * 8. Telegram username
 * 9. Wallet address (shortened)
 * 10. User ID (as fallback)
 *
 * @param user - Privy user object
 * @returns Human-readable identifier string
 */
export function getPrivyUserIdentifier(user: any): string {
  if (!user) return "--";

  // Email
  if (user.email?.address) {
    return user.email.address;
  }

  // Phone number
  if (user.phone?.number) {
    return user.phone.number;
  }

  // Google
  if (user.google?.email) {
    return user.google.email;
  }
  if (user.google?.name) {
    return user.google.name;
  }

  // Twitter
  if (user.twitter?.username) {
    return `@${user.twitter.username}`;
  }
  if (user.twitter?.name) {
    return user.twitter.name;
  }

  // Discord
  if (user.discord?.username) {
    return user.discord.username;
  }

  // GitHub
  if (user.github?.username) {
    return user.github.username;
  }

  // Farcaster
  if (user.farcaster?.username) {
    return user.farcaster.username;
  }

  // Telegram
  if (user.telegram?.username) {
    return `@${user.telegram.username}`;
  }
  if (user.telegram?.firstName) {
    return user.telegram.firstName;
  }

  // Wallet address (shortened)
  if (user.wallet?.address) {
    const addr = user.wallet.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Linked accounts - check for any wallet
  if (user.linkedAccounts && user.linkedAccounts.length > 0) {
    const wallet = user.linkedAccounts.find(
      (account: any) => account.type === "wallet"
    );
    if (wallet?.address) {
      const addr = wallet.address;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
  }

  // Fallback to user ID
  if (user.id) {
    return `User ${user.id.slice(0, 8)}`;
  }

  return "--";
}
