import { getTokenMetadata } from "@/constants/Tokens";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
import { ERC20_ABI } from "@/lib/config/abis";
import { STACKD_ADDITIONAL_APR } from "@/lib/loans/stackdFee";
import {
  getUserPositions,
  encodeFluidSupply,
  encodeFluidWithdraw,
  encodeFluidBorrow,
  encodeFluidRepay,
  encodeFluidSupplyAndBorrow,
  getXautVaultConfig,
  getFluidOraclePrice,
  convertOraclePriceToUsd,
  XAUT_USDT_VAULT,
  ORACLE_PRICE_DECIMALS,
  FLUID_MIN_AMOUNT_RAW,
  type FluidUserPosition,
  type FluidVaultData,
} from "@/lib/web3/fluid";
import { encodeApproveData } from "@/lib/web3/compound";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useWeb3 } from "@/providers/Web3Provider";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
import type { Address, Hex, PublicClient } from "viem";
import { formatUnits } from "viem";
import { mainnet } from "viem/chains";

// Token symbols used for collateral in Fluid
const COLLATERAL_TOKEN = "XAUT";

// Supported borrow tokens for XAUT collateral vaults
const SUPPORTED_BORROW_TOKENS = {
  [ETHEREUM_TOKEN_ADDRESSES.USDT.toLowerCase()]: "USDT",
} as const;

// Helper to convert Fluid's factor format to percentage
// Fluid uses 1e4 for percentages (10000 = 100%)
const toPercentage = (value: bigint | number) => (Number(value) / 1e4) * 100;

// Helper to convert Fluid's rate format to APR percentage
// Fluid rates are per second, scaled by 1e18
const rateToApr = (ratePerSecond: bigint) => {
  const secondsPerYear = 60 * 60 * 24 * 365;
  return (Number(ratePerSecond) / 1e18) * secondsPerYear * 100;
};

/**
 * Pre-flight validation for withdrawal amounts
 *
 * Validates that a withdrawal will not:
 * 1. Exceed the total collateral available
 * 2. Exceed the unlocked collateral (collateral not needed to maintain loan health)
 * 3. Cause the position's LTV to exceed the maximum allowed LTV
 *
 * This prevents "Execution reverted for an unknown reason" errors by checking
 * position health BEFORE sending the transaction.
 *
 * @param withdrawalAmount - Amount to withdraw in raw units (bigint)
 * @param collateralRaw - Total collateral in raw units (bigint)
 * @param borrowRaw - Total borrowed amount in raw units (bigint)
 * @param collateralPrice - Price of collateral token in USD (from external source like CoinGecko)
 * @param borrowPrice - Price of borrow token in USD
 * @param maxLtv - Maximum LTV percentage (e.g., 75 for 75%)
 * @param collateralDecimals - Decimals for collateral token (XAUT = 6)
 * @param borrowDecimals - Decimals for borrow token (USDT = 6)
 * @param oraclePrice - Optional Fluid oracle price in USD (preferred over collateralPrice when available)
 */
export function validateWithdrawalAmount(
  withdrawalAmount: bigint,
  collateralRaw: bigint,
  borrowRaw: bigint,
  collateralPrice: number,
  borrowPrice: number,
  maxLtv: number,
  collateralDecimals: number = 6,
  borrowDecimals: number = 6,
  oraclePrice?: number
): { valid: true } | { valid: false; error: string } {
  // Use oracle price when available, fallback to external collateral price
  // Oracle price is more accurate as it matches what Fluid uses on-chain
  const effectivePrice = oraclePrice ?? collateralPrice;
  // Check 1: Cannot withdraw more than total collateral
  if (withdrawalAmount > collateralRaw) {
    return {
      valid: false,
      error: "Withdrawal amount exceeds available collateral",
    };
  }

  // If there's no borrow, any withdrawal up to collateral is valid
  if (borrowRaw === BigInt(0)) {
    return { valid: true };
  }

  // Calculate USD values using effective price (oracle price when available)
  const collateralUsd =
    (Number(collateralRaw) / 10 ** collateralDecimals) * effectivePrice;
  const borrowUsd = (Number(borrowRaw) / 10 ** borrowDecimals) * borrowPrice;
  const withdrawalUsd =
    (Number(withdrawalAmount) / 10 ** collateralDecimals) * effectivePrice;

  // Calculate locked collateral (minimum collateral needed to maintain effective maxLtv)
  // We use (maxLtv - 1) to provide a 1% safety buffer
  // lockedCollateral = borrowedUSD / ((maxLtv - 1) / 100)
  const effectiveMaxLtv = maxLtv - 1;
  const lockedCollateralUsd = borrowUsd / (effectiveMaxLtv / 100);

  // Calculate available (unlocked) collateral in USD
  const availableCollateralUsd = collateralUsd - lockedCollateralUsd;

  // Check 2: Cannot withdraw more than unlocked collateral
  if (withdrawalUsd > availableCollateralUsd) {
    return {
      valid: false,
      error:
        "Withdrawal would exceed available collateral. Some collateral is locked to maintain your loan health. Reduce the withdrawal amount or repay some debt to unlock more collateral.",
    };
  }

  // Check 3: Verify post-withdrawal LTV doesn't exceed maxLtv
  const postWithdrawalCollateralUsd = collateralUsd - withdrawalUsd;

  // Avoid division by zero
  if (postWithdrawalCollateralUsd <= 0) {
    return {
      valid: false,
      error:
        "Cannot withdraw entire collateral while loan is active. Repay your loan first.",
    };
  }

  const postWithdrawalLtv = (borrowUsd / postWithdrawalCollateralUsd) * 100;

  if (postWithdrawalLtv > effectiveMaxLtv) {
    return {
      valid: false,
      error: `Withdrawal would cause your loan-to-value ratio (${postWithdrawalLtv.toFixed(1)}%) to exceed the maximum allowed (${effectiveMaxLtv}%). Reduce withdrawal amount or repay some debt first.`,
    };
  }

  return { valid: true };
}

interface FluidData {
  collateralRaw: bigint;
  borrowRaw: bigint;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
  nftId?: bigint;
  borrowToken: string; // Dynamic borrow token (USDT)
  oraclePrice: number; // Fluid oracle price in USD (from on-chain oracle)
}

type Asset = {
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
};

type TransactionResult = { txHash: Hex | null; error: string | null };

type UseFluidResult = {
  collateralRaw: bigint;
  borrowRaw: bigint;
  suppliedAssets: Asset[];
  borrowedAssets: Asset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
  totalBorrowApr: number; // Market APR + Stack'd fee
  stackdFeeApr: number; // Stack'd additional fee
  netLoanValue: number;
  hasPosition: boolean;
  nftId?: bigint;
  oraclePrice: number; // Fluid oracle price in USD (from on-chain oracle)
  // Transaction functions
  supply: (amount: bigint) => Promise<TransactionResult>;
  withdraw: (amount: bigint) => Promise<TransactionResult>;
  borrow: (amount: bigint) => Promise<TransactionResult>;
  repay: (amount: bigint, isMaxRepay?: boolean) => Promise<TransactionResult>;
  supplyAndBorrow: (collateralAmount: bigint, borrowAmount: bigint) => Promise<TransactionResult>;
  approve: (token: Address, amount: bigint, spender?: Address) => Promise<TransactionResult>;
  allowance: (token: Address, spender?: Address) => Promise<bigint | null>;
};

// Query key factory for Fluid data
export const fluidKeys = {
  all: ["fluid"] as const,
  byAccount: (account: string) => [...fluidKeys.all, account] as const,
};

// Fetcher function for Fluid data
async function fetchFluidData(
  publicClient: PublicClient,
  account: string
): Promise<FluidData> {
  const userAddress = account as Address;
  try {
    const { positions, vaultsData } = await getUserPositions(
      publicClient,
      userAddress
    );

    // Find XAUT collateral position
    // Match by checking if the supply token is XAUT and borrow token is USDT
    const xautAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT.toLowerCase();

    let matchingPosition: FluidUserPosition | undefined;
    let matchingVaultData: FluidVaultData | undefined;
    let matchedBorrowToken: string | undefined;

    for (let i = 0; i < positions.length; i++) {
      const vaultData = vaultsData[i];
      const borrowTokenAddress = vaultData.borrowToken.toLowerCase();
      const borrowTokenSymbol = SUPPORTED_BORROW_TOKENS[borrowTokenAddress];

      // Check if this vault uses XAUT as collateral and a supported borrow token (USDT)
      if (
        vaultData.supplyToken.toLowerCase() === xautAddress &&
        borrowTokenSymbol
      ) {
        matchingPosition = positions[i];
        matchingVaultData = vaultData;
        matchedBorrowToken = borrowTokenSymbol;
        break;
      }
    }

    // If no XAUT position with supported borrow token found, return vault config (not zeros!)
    // This is critical for NEW loan creation - we need maxLtv to calculate max borrow amounts
    if (!matchingPosition || !matchingVaultData || !matchedBorrowToken) {
      const vaultConfig = await getXautVaultConfig(publicClient);
      // Also fetch oracle price for new loan creation
      const oraclePriceData = await getFluidOraclePrice(publicClient);
      return {
        collateralRaw: BigInt(0),
        borrowRaw: BigInt(0),
        maxLtv: vaultConfig.maxLtv,
        liquidationRatio: vaultConfig.liquidationRatio,
        borrowApr: vaultConfig.borrowApr,
        nftId: undefined,
        borrowToken: "USDT",
        oraclePrice: oraclePriceData?.priceUsd ?? 0,
      };
    }

    // Convert oracle price from raw bigint to USD
    const oraclePriceUsd = convertOraclePriceToUsd(matchingVaultData.oraclePrice);

    const result: FluidData = {
      collateralRaw: matchingPosition.supply,
      borrowRaw: matchingPosition.borrow,
      maxLtv: toPercentage(matchingVaultData.collateralFactor),
      liquidationRatio: toPercentage(matchingVaultData.liquidationThreshold),
      borrowApr: rateToApr(matchingVaultData.borrowRate),
      nftId: matchingPosition.nftId,
      borrowToken: matchedBorrowToken,
      oraclePrice: oraclePriceUsd,
    };

    return result;
  } catch (error) {
    console.error("[FLUID] Error fetching positions:", error);
    // Return vault config on error (not zeros!) so new loans can still be created
    const vaultConfig = await getXautVaultConfig(publicClient);
    // Try to fetch oracle price even on error
    const oraclePriceData = await getFluidOraclePrice(publicClient).catch(() => null);
    return {
      collateralRaw: BigInt(0),
      borrowRaw: BigInt(0),
      maxLtv: vaultConfig.maxLtv,
      liquidationRatio: vaultConfig.liquidationRatio,
      borrowApr: vaultConfig.borrowApr,
      nftId: undefined,
      borrowToken: "USDT",
      oraclePrice: oraclePriceData?.priceUsd ?? 0,
    };
  }
}

export function useFluid(): UseFluidResult {
  const { ethereumPublicClient, walletClient, activeWalletAddress, sendSponsoredTransaction } = useWeb3();
  const getTokenPrice = useGetTokenPrice();
  const acct = walletClient?.account?.address || activeWalletAddress;

  // Transaction lock to prevent duplicate submissions
  const transactionInProgress = useRef(false);

  // Use TanStack Query for data fetching with caching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: fluidKeys.byAccount(acct || ""),
    queryFn: () => fetchFluidData(ethereumPublicClient!, acct!),
    enabled: !!ethereumPublicClient && !!acct,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });

  const collateralRaw = data?.collateralRaw ?? BigInt(0);
  const borrowRaw = data?.borrowRaw ?? BigInt(0);
  const maxLtv = data?.maxLtv ?? 0;
  const liquidationRatio = data?.liquidationRatio ?? 0;
  const borrowApr = data?.borrowApr ?? 0;
  const nftId = data?.nftId;
  const borrowToken = data?.borrowToken ?? "USDT";
  const oraclePrice = data?.oraclePrice ?? 0;

  const collateralAmount = Number(
    formatUnits(collateralRaw, getTokenMetadata(COLLATERAL_TOKEN).decimals)
  );

  const borrowAmount = Number(
    formatUnits(borrowRaw, getTokenMetadata(borrowToken).decimals)
  );

  const xautPrice = getTokenPrice(COLLATERAL_TOKEN);
  const borrowTokenPrice = getTokenPrice(borrowToken);
  const collateralUsd = collateralAmount * xautPrice;
  const borrowUsd = borrowAmount * borrowTokenPrice;
  const netLoanValue = collateralUsd - borrowUsd;

  // Determine if user has an active position
  const hasPosition = collateralRaw > BigInt(0) || borrowRaw > BigInt(0);

  const suppliedAssets: Asset[] = useMemo(
    () => [
      {
        symbol: COLLATERAL_TOKEN,
        amount: collateralAmount,
        usdValue: collateralUsd,
        decimals: getTokenMetadata(COLLATERAL_TOKEN)?.decimals,
      },
    ],
    [collateralAmount, collateralUsd]
  );

  const borrowedAssets: Asset[] = useMemo(
    () => [
      {
        symbol: borrowToken,
        amount: borrowAmount,
        usdValue: borrowUsd,
        decimals: getTokenMetadata(borrowToken)?.decimals,
      },
    ],
    [borrowToken, borrowAmount, borrowUsd]
  );

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Transaction functions for Fluid vault operations on Ethereum mainnet

  const supply = useCallback(
    async (amount: bigint): Promise<TransactionResult> => {
      if (!nftId) {
        return { txHash: null, error: "No active position found. Cannot supply without nftId." };
      }
      if (!acct) {
        return { txHash: null, error: "No account connected" };
      }
      if (!ethereumPublicClient) {
        return { txHash: null, error: "No public client available" };
      }

      try {
        // Pre-approval check for iOS Safari passkey wallets
        // The paymaster simulation fails if allowance isn't already set,
        // so we approve BEFORE the supply transaction
        const xautAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT as Address;
        const spender = XAUT_USDT_VAULT as Address;

        // Check current allowance
        let currentAllowance: bigint;
        try {
          const allowanceResult = await ethereumPublicClient.readContract({
            address: xautAddress,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [acct as Address, spender],
          });
          currentAllowance = allowanceResult as bigint;
        } catch (err) {
          console.error("[FLUID] Allowance check failed:", err);
          currentAllowance = BigInt(0);
        }

        console.log("[FLUID] Supply - Current allowance:", currentAllowance.toString());
        console.log("[FLUID] Supply - Required amount:", amount.toString());

        // If allowance is insufficient, approve first
        if (currentAllowance < amount) {
          console.log("[FLUID] Supply - Approving XAUT for vault...");
          const approveData = encodeApproveData(spender, amount);
          const approvalResult = await sendSponsoredTransaction({
            to: xautAddress,
            data: approveData,
            chainId: mainnet.id,
            forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
          });

          if (approvalResult.error) {
            return { txHash: null, error: `Approval failed: ${approvalResult.error}` };
          }

          console.log("[FLUID] Supply - Approval tx submitted:", approvalResult.hash);
          // Wait for approval to be processed before supply
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Now execute the supply transaction
        const data = encodeFluidSupply(nftId, amount, acct as Address);
        const result = await sendSponsoredTransaction({
          to: XAUT_USDT_VAULT as Address,
          data,
          chainId: mainnet.id,
          forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown supply error";
        console.error("[FLUID] Supply failed:", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [nftId, acct, ethereumPublicClient, sendSponsoredTransaction]
  );

  const withdraw = useCallback(
    async (amount: bigint): Promise<TransactionResult> => {
      // Check transaction lock to prevent duplicate submissions
      if (transactionInProgress.current) {
        return { txHash: null, error: "Transaction already in progress" };
      }
      transactionInProgress.current = true;

      if (!nftId) {
        transactionInProgress.current = false;
        return { txHash: null, error: "No active position found. Cannot withdraw without nftId." };
      }
      if (!acct) {
        transactionInProgress.current = false;
        return { txHash: null, error: "No account connected" };
      }

      try {
        // Pre-flight position health check to prevent "Execution reverted" errors
        // Use oracle price when available (matches what Fluid uses on-chain)
        const collateralDecimals = getTokenMetadata(COLLATERAL_TOKEN).decimals;
        const borrowDecimals = getTokenMetadata(borrowToken).decimals;

        const validation = validateWithdrawalAmount(
          amount,
          collateralRaw,
          borrowRaw,
          xautPrice,
          borrowTokenPrice,
          maxLtv,
          collateralDecimals,
          borrowDecimals,
          oraclePrice > 0 ? oraclePrice : undefined // Pass oracle price if available
        );

        if (!validation.valid) {
          return { txHash: null, error: validation.error };
        }

        const data = encodeFluidWithdraw(nftId, amount, acct as Address);
        const result = await sendSponsoredTransaction({
          to: XAUT_USDT_VAULT as Address,
          data,
          chainId: mainnet.id,
          forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown withdraw error";
        console.error("[FLUID] Withdraw failed:", errorMessage);
        return { txHash: null, error: errorMessage };
      } finally {
        transactionInProgress.current = false;
      }
    },
    [nftId, acct, sendSponsoredTransaction, collateralRaw, borrowRaw, maxLtv, xautPrice, borrowTokenPrice, borrowToken, oraclePrice]
  );

  const borrow = useCallback(
    async (amount: bigint): Promise<TransactionResult> => {
      if (!nftId) {
        return { txHash: null, error: "No active position found. Cannot borrow without nftId." };
      }
      if (!acct) {
        return { txHash: null, error: "No account connected" };
      }

      try {
        const data = encodeFluidBorrow(nftId, amount, acct as Address);
        const result = await sendSponsoredTransaction({
          to: XAUT_USDT_VAULT as Address,
          data,
          chainId: mainnet.id,
          forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown borrow error";
        console.error("[FLUID] Borrow failed:", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [nftId, acct, sendSponsoredTransaction]
  );

  const repay = useCallback(
    async (amount: bigint, isMaxRepay: boolean = false): Promise<TransactionResult> => {
      if (!nftId) {
        return { txHash: null, error: "No active position found. Cannot repay without nftId." };
      }
      if (!acct) {
        return { txHash: null, error: "No account connected" };
      }

      // When doing max repay, vault computes exact on-chain debt (including accrued
      // interest) via INT256_MIN and pulls that amount via safeTransferFrom.
      // Pre-flight check: verify user has enough USDT to avoid FluidSafeTransferError (71001).
      if (isMaxRepay && ethereumPublicClient) {
        try {
          const usdtBalance = await ethereumPublicClient.readContract({
            address: ETHEREUM_TOKEN_ADDRESSES.USDT as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [acct as Address],
          }) as bigint;
          if (usdtBalance < borrowRaw && borrowRaw > 0n) {
            return {
              txHash: null,
              error: `Insufficient USDT to repay full debt. Balance: ${formatUnits(usdtBalance, 6)} USDT, Debt: ~${formatUnits(borrowRaw, 6)} USDT. Repay a partial amount or add more USDT.`,
            };
          }
        } catch (err) {
          console.warn("[FLUID] Pre-flight USDT balance check failed, proceeding:", err);
        }
      }

      try {
        const data = encodeFluidRepay(nftId, amount, acct as Address, isMaxRepay);
        const result = await sendSponsoredTransaction({
          to: XAUT_USDT_VAULT as Address,
          data,
          chainId: mainnet.id,
          forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown repay error";
        console.error("[FLUID] Repay failed:", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [nftId, acct, sendSponsoredTransaction, ethereumPublicClient, borrowRaw]
  );

  const approve = useCallback(
    async (
      token: Address,
      amount: bigint,
      spender: Address = XAUT_USDT_VAULT as Address
    ): Promise<TransactionResult> => {
      if (!acct) {
        return { txHash: null, error: "No account connected" };
      }

      try {
        // USDT on Ethereum mainnet has a non-standard approve() that reverts if
        // currentAllowance > 0 and newAmount > 0. Reset to 0 first if needed.
        const isUSDT = token.toLowerCase() === ETHEREUM_TOKEN_ADDRESSES.USDT.toLowerCase();
        if (isUSDT && ethereumPublicClient && amount > 0n) {
          const currentAllowance = await ethereumPublicClient.readContract({
            address: token,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [acct as Address, spender],
          }) as bigint;

          if (currentAllowance > 0n) {
            console.log("[FLUID] USDT: existing allowance detected, resetting to 0 first...");
            const resetData = encodeApproveData(spender, 0n);
            const resetResult = await sendSponsoredTransaction({
              to: token,
              data: resetData,
              chainId: mainnet.id,
              forceNoSponsor: true,
            });
            if (resetResult.error) {
              return { txHash: null, error: `USDT allowance reset failed: ${resetResult.error}` };
            }
            // Wait for reset to be mined before sending the real approval
            if (resetResult.hash) {
              await ethereumPublicClient.waitForTransactionReceipt({ hash: resetResult.hash as Hex });
            }
          }
        }

        const data = encodeApproveData(spender, amount);
        const result = await sendSponsoredTransaction({
          to: token,
          data,
          chainId: mainnet.id,
          forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown approval error";
        console.error("[FLUID] Approve failed:", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [acct, sendSponsoredTransaction, ethereumPublicClient]
  );

  const allowance = useCallback(
    async (
      token: Address,
      spender: Address = XAUT_USDT_VAULT as Address
    ): Promise<bigint | null> => {
      if (!ethereumPublicClient || !acct) return null;
      try {
        const result = await ethereumPublicClient.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [acct as Address, spender],
        });
        return result as bigint;
      } catch (err) {
        console.error("[FLUID] Allowance read failed:", err);
        return null;
      }
    },
    [ethereumPublicClient, acct]
  );

  /**
   * Combined supply collateral + borrow operation
   * Can create a new position (nftId = 0) or add to existing
   */
  const supplyAndBorrow = useCallback(
    async (
      collateralAmount: bigint,
      borrowAmount: bigint
    ): Promise<TransactionResult> => {
      if (!acct) {
        return { txHash: null, error: "No account connected" };
      }
      if (!ethereumPublicClient) {
        return { txHash: null, error: "No public client available" };
      }

      // Validate minimum amounts - Fluid vault rejects amounts below 10000 raw units
      if (collateralAmount < FLUID_MIN_AMOUNT_RAW) {
        return { txHash: null, error: "Minimum collateral is 0.01 XAUT" };
      }
      if (borrowAmount < FLUID_MIN_AMOUNT_RAW) {
        return { txHash: null, error: "Minimum borrow is $0.01 USDT" };
      }

      try {
        // Use existing nftId or 0 to create new position
        const positionNftId = nftId ?? BigInt(0);

        console.log("[FLUID] SupplyAndBorrow:", {
          nftId: positionNftId.toString(),
          collateralAmount: collateralAmount.toString(),
          borrowAmount: borrowAmount.toString(),
          isNewPosition: positionNftId === BigInt(0),
        });

        // Pre-approval check for external wallets and iOS Safari passkey wallets
        // The vault needs approval to transfer XAUT from the user
        const xautAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT as Address;
        const spender = XAUT_USDT_VAULT as Address;

        // Check current allowance
        let currentAllowance: bigint;
        try {
          const allowanceResult = await ethereumPublicClient.readContract({
            address: xautAddress,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [acct as Address, spender],
          });
          currentAllowance = allowanceResult as bigint;
        } catch (err) {
          console.error("[FLUID] SupplyAndBorrow allowance check failed:", err);
          currentAllowance = BigInt(0);
        }

        console.log("[FLUID] SupplyAndBorrow - Current allowance:", currentAllowance.toString());
        console.log("[FLUID] SupplyAndBorrow - Required collateral amount:", collateralAmount.toString());

        // If allowance is insufficient, approve first
        if (currentAllowance < collateralAmount) {
          console.log("[FLUID] SupplyAndBorrow - Approving XAUT for vault...");
          const approveData = encodeApproveData(spender, collateralAmount);
          const approvalResult = await sendSponsoredTransaction({
            to: xautAddress,
            data: approveData,
            chainId: mainnet.id,
            forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
          });

          if (approvalResult.error) {
            return { txHash: null, error: `Approval failed: ${approvalResult.error}` };
          }

          console.log("[FLUID] SupplyAndBorrow - Approval tx submitted:", approvalResult.hash);
          // Wait for approval to be processed before the main transaction
          // Ethereum mainnet blocks are ~12 seconds, so wait a bit for the tx to be included
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Re-check allowance to ensure approval was processed
          try {
            const newAllowance = await ethereumPublicClient.readContract({
              address: xautAddress,
              abi: ERC20_ABI,
              functionName: "allowance",
              args: [acct as Address, spender],
            });
            console.log("[FLUID] SupplyAndBorrow - New allowance after approval:", (newAllowance as bigint).toString());
            if ((newAllowance as bigint) < collateralAmount) {
              console.log("[FLUID] SupplyAndBorrow - Allowance still insufficient, waiting longer...");
              // Wait additional time for the approval to be mined
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } catch (err) {
            console.error("[FLUID] SupplyAndBorrow - Error re-checking allowance:", err);
          }
        }

        const data = encodeFluidSupplyAndBorrow(
          positionNftId,
          collateralAmount,
          borrowAmount,
          acct as Address
        );

        const result = await sendSponsoredTransaction({
          to: XAUT_USDT_VAULT as Address,
          data,
          chainId: mainnet.id,
          forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
        });

        if (result.error) {
          return { txHash: null, error: result.error };
        }
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[FLUID] Supply and borrow failed:", err);
        return { txHash: null, error: errorMessage };
      }
    },
    [nftId, acct, ethereumPublicClient, sendSponsoredTransaction]
  );

  return {
    collateralRaw,
    borrowRaw,
    suppliedAssets,
    borrowedAssets,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    refetch: handleRefetch,
    maxLtv,
    liquidationRatio,
    borrowApr,
    totalBorrowApr: borrowApr + STACKD_ADDITIONAL_APR,
    stackdFeeApr: STACKD_ADDITIONAL_APR,
    netLoanValue,
    hasPosition,
    nftId,
    oraclePrice,
    // Transaction functions
    supply,
    withdraw,
    borrow,
    repay,
    supplyAndBorrow,
    approve,
    allowance,
  };
}

// Prefetch function for use in other components
export function prefetchFluidData(
  queryClient: QueryClient,
  publicClient: PublicClient,
  account: string
) {
  return queryClient.prefetchQuery({
    queryKey: fluidKeys.byAccount(account),
    queryFn: () => fetchFluidData(publicClient, account),
    staleTime: 30_000,
  });
}
