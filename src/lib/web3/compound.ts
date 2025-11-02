import { C_COMPOUND_ABI, C_COMPOUND_ADDR } from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { arbitrum } from "viem/chains";

const COMPOUND_ADDRESS = formatAddress(C_COMPOUND_ADDR);

// Note: These functions assume publicClient and walletClient from Web3Provider,
// and account from useEmbeddedWallet. Pass them as parameters.

export async function userCollateral(
  publicClient: PublicClient,
  user: Address,
  token: Address
): Promise<bigint> {
  const result = (await publicClient.readContract({
    address: COMPOUND_ADDRESS,
    abi: C_COMPOUND_ABI,
    functionName: "userCollateral",
    args: [user, token],
  })) as [bigint, bigint]; // [balance, _reserved]

  return result[0]; // Return the balance
}

export async function supply(
  walletClient: WalletClient,
  account: Address,
  token: Address,
  amount: bigint
): Promise<Hex> {
  return await walletClient.writeContract({
    address: COMPOUND_ADDRESS,
    abi: C_COMPOUND_ABI,
    functionName: "supply",
    args: [token, amount],
    account,
    chain: arbitrum,
  });
}

export async function withdraw(
  walletClient: WalletClient,
  account: Address,
  token: Address,
  amount: bigint
): Promise<Hex> {
  return await walletClient.writeContract({
    address: COMPOUND_ADDRESS,
    abi: C_COMPOUND_ABI,
    functionName: "withdraw",
    args: [token, amount],
    account,
    chain: arbitrum,
  });
}

export async function borrowBalanceOf(
  publicClient: PublicClient,
  user: Address
): Promise<bigint> {
  return await publicClient.readContract({
    address: COMPOUND_ADDRESS,
    abi: C_COMPOUND_ABI,
    functionName: "borrowBalanceOf",
    args: [user],
  });
}

export async function getAssetInfo(
  publicClient: PublicClient,
  asset: Address
): Promise<{
  borrowCollateralFactor: bigint;
  liquidateCollateralFactor: bigint;
}> {
  const result = (await publicClient.readContract({
    address: COMPOUND_ADDRESS,
    abi: C_COMPOUND_ABI,
    functionName: "getAssetInfoByAddress",
    args: [asset],
  })) as unknown as readonly [
    number,
    Address,
    Address,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint
  ]; // [offset, asset, priceFeed, scale, borrowCollateralFactor, liquidateCollateralFactor, liquidationFactor, supplyCap]

  return {
    borrowCollateralFactor: result[4],
    liquidateCollateralFactor: result[5],
  };
}

export async function getUtilization(
  publicClient: PublicClient
): Promise<bigint> {
  return await publicClient.readContract({
    address: COMPOUND_ADDRESS,
    abi: C_COMPOUND_ABI,
    functionName: "getUtilization",
  });
}

export async function getBorrowRate(
  publicClient: PublicClient,
  utilization: bigint
): Promise<bigint> {
  return await publicClient.readContract({
    address: COMPOUND_ADDRESS,
    abi: C_COMPOUND_ABI,
    functionName: "getBorrowRate",
    args: [utilization],
  });
}
