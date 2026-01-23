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
  XAUT_USDT_VAULT,
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

interface FluidData {
  collateralRaw: bigint;
  borrowRaw: bigint;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
  nftId?: bigint;
  borrowToken: string; // Dynamic borrow token (USDT)
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
  // Transaction functions
  supply: (amount: bigint) => Promise<TransactionResult>;
  withdraw: (amount: bigint) => Promise<TransactionResult>;
  borrow: (amount: bigint) => Promise<TransactionResult>;
  repay: (amount: bigint) => Promise<TransactionResult>;
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
  console.log("[FLUID FETCH] Starting fetch for account:", account);

  try {
    console.log("[FLUID FETCH] Calling getUserPositions...");
    const { positions, vaultsData } = await getUserPositions(
      publicClient,
      userAddress
    );
    console.log("[FLUID FETCH] Got response:", { positionsCount: positions.length, vaultsCount: vaultsData.length });

    // Find XAUT collateral position
    // Match by checking if the supply token is XAUT and borrow token is USDT
    const xautAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT.toLowerCase();

    let matchingPosition: FluidUserPosition | undefined;
    let matchingVaultData: FluidVaultData | undefined;
    let matchedBorrowToken: string | undefined;

    // Debug: Log all positions found
    console.log("[FLUID] Total positions found:", positions.length);

    for (let i = 0; i < positions.length; i++) {
      const vaultData = vaultsData[i];
      const borrowTokenAddress = vaultData.borrowToken.toLowerCase();
      const borrowTokenSymbol = SUPPORTED_BORROW_TOKENS[borrowTokenAddress];

      // Debug: Log each vault's tokens
      console.log(`[FLUID] Position ${i}:`, {
        supplyToken: vaultData.supplyToken,
        borrowToken: vaultData.borrowToken,
        borrowTokenSymbol: borrowTokenSymbol || "NOT_SUPPORTED",
        isXaut: vaultData.supplyToken.toLowerCase() === xautAddress,
      });

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
      console.log("[FLUID] No XAUT position found, fetching vault config for new loan creation");
      const vaultConfig = await getXautVaultConfig(publicClient);
      return {
        collateralRaw: BigInt(0),
        borrowRaw: BigInt(0),
        maxLtv: vaultConfig.maxLtv,
        liquidationRatio: vaultConfig.liquidationRatio,
        borrowApr: vaultConfig.borrowApr,
        nftId: undefined,
        borrowToken: "USDT",
      };
    }

    const result: FluidData = {
      collateralRaw: matchingPosition.supply,
      borrowRaw: matchingPosition.borrow,
      maxLtv: toPercentage(matchingVaultData.collateralFactor),
      liquidationRatio: toPercentage(matchingVaultData.liquidationThreshold),
      borrowApr: rateToApr(matchingVaultData.borrowRate),
      nftId: matchingPosition.nftId,
      borrowToken: matchedBorrowToken,
    };

    // Debug logging
    console.log("[FLUID] Account:", account);
    console.log("[FLUID] NFT ID:", matchingPosition.nftId.toString());
    console.log("[FLUID] Collateral Raw:", matchingPosition.supply.toString());
    console.log("[FLUID] Borrow Raw:", matchingPosition.borrow.toString());
    console.log("[FLUID] Max LTV:", result.maxLtv, "%");
    console.log("[FLUID] Liquidation Ratio:", result.liquidationRatio, "%");
    console.log("[FLUID] Borrow APR:", result.borrowApr, "%");

    return result;
  } catch (error) {
    console.error("[FLUID] Error fetching positions:", error);
    // Return vault config on error (not zeros!) so new loans can still be created
    const vaultConfig = await getXautVaultConfig(publicClient);
    return {
      collateralRaw: BigInt(0),
      borrowRaw: BigInt(0),
      maxLtv: vaultConfig.maxLtv,
      liquidationRatio: vaultConfig.liquidationRatio,
      borrowApr: vaultConfig.borrowApr,
      nftId: undefined,
      borrowToken: "USDT",
    };
  }
}

export function useFluid(): UseFluidResult {
  const { ethereumPublicClient, walletClient, activeWalletAddress, sendSponsoredTransaction } = useWeb3();
  const getTokenPrice = useGetTokenPrice();
  const acct = walletClient?.account?.address || activeWalletAddress;

  // Transaction lock to prevent duplicate submissions
  const transactionInProgress = useRef(false);

  // Debug: Log query prerequisites
  console.log("[FLUID HOOK] ethereumPublicClient:", !!ethereumPublicClient);
  console.log("[FLUID HOOK] walletClient?.account?.address:", walletClient?.account?.address);
  console.log("[FLUID HOOK] activeWalletAddress:", activeWalletAddress);
  console.log("[FLUID HOOK] acct:", acct);
  console.log("[FLUID HOOK] query enabled:", !!ethereumPublicClient && !!acct);

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

  // Debug logging for USD calculations
  console.log("[FLUID] XAUT Price:", xautPrice);
  console.log(`[FLUID] ${borrowToken} Price:`, borrowTokenPrice);
  console.log("[FLUID] Collateral Amount:", collateralAmount, "XAUT");
  console.log("[FLUID] Collateral USD:", collateralUsd);
  console.log(`[FLUID] Borrow Amount:`, borrowAmount, borrowToken);
  console.log("[FLUID] Borrow USD:", borrowUsd);
  console.log("[FLUID] Net Loan Value:", netLoanValue);

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
        // Debug logging for withdrawal issue investigation
        const negativeAmount = -amount;
        console.log("[FLUID WITHDRAW DEBUG] ==================");
        console.log("[FLUID WITHDRAW DEBUG] Input amount (bigint):", amount.toString());
        console.log("[FLUID WITHDRAW DEBUG] Input amount (hex):", "0x" + amount.toString(16));
        console.log("[FLUID WITHDRAW DEBUG] Negative amount (bigint):", negativeAmount.toString());
        console.log("[FLUID WITHDRAW DEBUG] Negative amount (hex):", negativeAmount < 0n
          ? "-0x" + (-negativeAmount).toString(16)
          : "0x" + negativeAmount.toString(16));
        console.log("[FLUID WITHDRAW DEBUG] NFT ID:", nftId.toString());
        console.log("[FLUID WITHDRAW DEBUG] Recipient:", acct);
        console.log("[FLUID WITHDRAW DEBUG] Vault address:", XAUT_USDT_VAULT);

        const data = encodeFluidWithdraw(nftId, amount, acct as Address);
        console.log("[FLUID WITHDRAW DEBUG] Encoded calldata:", data);
        console.log("[FLUID WITHDRAW DEBUG] Calldata length:", data.length, "chars");

        // Decode and verify the calldata structure
        // First 4 bytes (8 hex chars after 0x) = function selector
        // Next 32 bytes = nftId, next 32 = collateralDelta, next 32 = debtDelta, next 32 = recipient
        const selector = data.slice(0, 10);
        const param1 = data.slice(10, 74);  // nftId
        const param2 = data.slice(74, 138); // collateralDelta (should be negative)
        const param3 = data.slice(138, 202); // debtDelta (should be 0)
        const param4 = data.slice(202, 266); // recipient address

        console.log("[FLUID WITHDRAW DEBUG] Function selector:", selector);
        console.log("[FLUID WITHDRAW DEBUG] Param 1 (nftId):", "0x" + param1);
        console.log("[FLUID WITHDRAW DEBUG] Param 2 (collateralDelta):", "0x" + param2);
        console.log("[FLUID WITHDRAW DEBUG] Param 3 (debtDelta):", "0x" + param3);
        console.log("[FLUID WITHDRAW DEBUG] Param 4 (recipient):", "0x" + param4);
        console.log("[FLUID WITHDRAW DEBUG] ==================");

        const result = await sendSponsoredTransaction({
          to: XAUT_USDT_VAULT as Address,
          data,
          chainId: mainnet.id,
          forceNoSponsor: true, // Disable sponsorship for Ethereum mainnet Fluid operations
        });

        if (result.error) {
          console.error("[FLUID WITHDRAW DEBUG] Transaction error:", result.error);
          return { txHash: null, error: result.error };
        }
        console.log("[FLUID WITHDRAW DEBUG] Transaction success:", result.hash);
        return { txHash: result.hash as Hex, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown withdraw error";
        console.error("[FLUID WITHDRAW DEBUG] Exception:", err);
        return { txHash: null, error: errorMessage };
      } finally {
        transactionInProgress.current = false;
      }
    },
    [nftId, acct, sendSponsoredTransaction]
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
    async (amount: bigint): Promise<TransactionResult> => {
      if (!nftId) {
        return { txHash: null, error: "No active position found. Cannot repay without nftId." };
      }
      if (!acct) {
        return { txHash: null, error: "No account connected" };
      }

      try {
        const data = encodeFluidRepay(nftId, amount, acct as Address);
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
    [nftId, acct, sendSponsoredTransaction]
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
    [acct, sendSponsoredTransaction]
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

      try {
        // Use existing nftId or 0 to create new position
        const positionNftId = nftId ?? BigInt(0);

        console.log("[FLUID] SupplyAndBorrow:", {
          nftId: positionNftId.toString(),
          collateralAmount: collateralAmount.toString(),
          borrowAmount: borrowAmount.toString(),
          isNewPosition: positionNftId === BigInt(0),
        });

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
    [nftId, acct, sendSponsoredTransaction]
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
