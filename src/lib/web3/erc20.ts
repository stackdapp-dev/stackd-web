import {
  erc20Abi,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import { arbitrum } from "viem/chains";

export async function allowance(
  publicClient: PublicClient,
  owner: Address,
  token: Address,
  spender: Address
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
  })) as bigint;
}

export async function approve(
  walletClient: WalletClient,
  account: Address,
  token: Address,
  spender: Address,
  amount: bigint
): Promise<Hex> {
  return await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
    account,
    chain: arbitrum,
  });
}

export async function transfer(
  walletClient: WalletClient,
  account: Address,
  recipient: Address,
  token: Address,
  amount: bigint
): Promise<Hex> {
  return await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, amount],
    account,
    chain: arbitrum,
  });
}

// Encode functions for sponsored transactions
export function encodeTransferData(recipient: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, amount],
  });
}

export function encodeApproveData(spender: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
  });
}

