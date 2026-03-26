/**
 * Fluid Vault Operations — Live Mainnet Transactions
 *
 * Executes all 4 vault operations against a real Fluid position:
 * a. Add collateral (supply XAUT)
 * b. Borrow USDT
 * c. Repay USDT
 * d. Withdraw collateral (withdraw XAUT)
 *
 * Uses TEST_PRIVATE_KEY from .env to sign transactions directly via viem.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  encodeFunctionData,
  formatUnits,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  erc20Abi,
} from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { FLUID_VAULT_ABI, XAUT_USDT_VAULT } from "@/lib/web3/fluid";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
import { boostGasFees } from "@/lib/web3/gasBoost";

// --- Constants ---
const VAULT_ADDR = XAUT_USDT_VAULT as Address;
const XAUT_ADDR = ETHEREUM_TOKEN_ADDRESSES.XAUT;
const USDT_ADDR = ETHEREUM_TOKEN_ADDRESSES.USDT;
const VAULT_RESOLVER_ADDR = "0xA5C3E16523eeeDDcC34706b0E6bE88b4c6EA95cC" as Address;

const SIMPLE_RESOLVER_ABI = parseAbi([
  "function positionsNftIdOfUser(address user_) view returns (uint256[])",
]);

const POSITION_BY_NFT_ABI = parseAbi([
  "function positionByNftId(uint256 nftId_) view returns ((uint256 nftId, address owner, bool isLiquidated, bool isSupplyPosition, int256 tick, uint256 tickId, uint256 beforeSupply, uint256 beforeBorrow, uint256 beforeDustBorrow, uint256 supply, uint256 borrow, uint256 dustBorrow))",
]);

// Use multiple RPC endpoints to avoid 429 rate limits
const MAINNET_RPC = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com";

// --- Helpers ---
function encodeOperate(nftId: bigint, colDelta: bigint, debtDelta: bigint, to: Address): Hex {
  return encodeFunctionData({
    abi: FLUID_VAULT_ABI,
    functionName: "operate",
    args: [nftId, colDelta, debtDelta, to],
  });
}

function encodeApprove(spender: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
  });
}

async function getPositionData(client: PublicClient, nftId: bigint) {
  const result = (await client.readContract({
    address: VAULT_RESOLVER_ADDR,
    abi: POSITION_BY_NFT_ABI,
    functionName: "positionByNftId",
    args: [nftId],
  })) as any;
  return { supply: result.supply as bigint, borrow: result.borrow as bigint, isLiquidated: result.isLiquidated as boolean };
}

async function sendTxWithGasBoost(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: { to: Address; data: Hex }
): Promise<Hex> {
  const boosted = await boostGasFees(publicClient);
  const txHash = await walletClient.sendTransaction({
    ...params,
    type: "eip1559" as any,
    maxFeePerGas: boosted.maxFeePerGas!,
    maxPriorityFeePerGas: boosted.maxPriorityFeePerGas!,
  });
  return txHash;
}

async function waitAndLog(publicClient: PublicClient, txHash: Hex, label: string) {
  console.log(`[${label}] TX submitted: ${txHash}`);
  console.log(`[${label}] Etherscan: https://etherscan.io/tx/${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 180_000 });
  console.log(`[${label}] Status: ${receipt.status} | Gas: ${receipt.gasUsed} | Block: ${receipt.blockNumber}`);
  expect(receipt.status).toBe("success");
  return receipt;
}

// =============================================================================
// TESTS
// =============================================================================

const TEST_KEY = process.env.TEST_PRIVATE_KEY;

describe.skipIf(!TEST_KEY)("Fluid Vault Live Operations", () => {
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let address: Address;
  let nftId: bigint;

  beforeAll(async () => {
    const account = privateKeyToAccount(TEST_KEY as Hex);
    address = account.address;

    publicClient = createPublicClient({ chain: mainnet, transport: http(MAINNET_RPC) });
    walletClient = createWalletClient({ account, chain: mainnet, transport: http(MAINNET_RPC) });

    // Read balances
    const [ethBal, xautBal, usdtBal] = await Promise.all([
      publicClient.getBalance({ address }),
      publicClient.readContract({ address: XAUT_ADDR, abi: erc20Abi, functionName: "balanceOf", args: [address] }),
      publicClient.readContract({ address: USDT_ADDR, abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    ]);

    console.log("\n===== WALLET STATE =====");
    console.log(`Address: ${address}`);
    console.log(`ETH:  ${formatUnits(ethBal, 18)}`);
    console.log(`XAUT: ${formatUnits(xautBal as bigint, 6)}`);
    console.log(`USDT: ${formatUnits(usdtBal as bigint, 6)}`);

    // Find position
    const nftIds = (await publicClient.readContract({
      address: VAULT_RESOLVER_ADDR,
      abi: SIMPLE_RESOLVER_ABI,
      functionName: "positionsNftIdOfUser",
      args: [address],
    })) as bigint[];

    console.log(`Positions: ${nftIds.map((n) => n.toString()).join(", ") || "none"}`);

    if (nftIds.length === 0) throw new Error("No Fluid position found for this wallet");

    // Use first active position
    for (const id of nftIds) {
      const pos = await getPositionData(publicClient, id);
      if (!pos.isLiquidated) {
        nftId = id;
        console.log(`\n===== POSITION #${id} =====`);
        console.log(`Supply: ${formatUnits(pos.supply, 6)} XAUT`);
        console.log(`Borrow: ${formatUnits(pos.borrow, 6)} USDT`);
        console.log("========================\n");
        break;
      }
    }

    if (!nftId) throw new Error("No active (non-liquidated) position found");
  });

  it("a. Add collateral (supply 0.01 XAUT)", async () => {
    const amount = 10_000n; // 0.01 XAUT (6 decimals) — minimum allowed by Fluid

    // Check XAUT balance
    const xautBal = (await publicClient.readContract({
      address: XAUT_ADDR, abi: erc20Abi, functionName: "balanceOf", args: [address],
    })) as bigint;
    if (xautBal < amount) {
      console.log(`[Supply] SKIP — insufficient XAUT balance: ${formatUnits(xautBal, 6)}`);
      return;
    }

    // 1. Approve XAUT for vault
    const allowance = (await publicClient.readContract({
      address: XAUT_ADDR, abi: erc20Abi, functionName: "allowance", args: [address, VAULT_ADDR],
    })) as bigint;

    if (allowance < amount) {
      console.log("[Supply] Approving XAUT...");
      const approveTx = await sendTxWithGasBoost(walletClient, publicClient, {
        to: XAUT_ADDR,
        data: encodeApprove(VAULT_ADDR, amount * 100n), // Approve 100x for future use
      });
      await waitAndLog(publicClient, approveTx, "Supply-Approve");

      // Wait for approval to propagate
      console.log("[Supply] Waiting for approval to be indexed...");
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      console.log(`[Supply] Allowance sufficient: ${allowance}`);
    }

    // 2. Supply collateral
    const posBefore = await getPositionData(publicClient, nftId);
    const txHash = await sendTxWithGasBoost(walletClient, publicClient, {
      to: VAULT_ADDR,
      data: encodeOperate(nftId, amount, 0n, address),
    });
    await waitAndLog(publicClient, txHash, "Supply");

    const posAfter = await getPositionData(publicClient, nftId);
    console.log(`[Supply] Collateral: ${formatUnits(posBefore.supply, 6)} → ${formatUnits(posAfter.supply, 6)} XAUT`);
    expect(posAfter.supply).toBeGreaterThan(posBefore.supply);
  });

  it("b. Borrow USDT (borrow 0.02 USDT)", async () => {
    const amount = 20_000n; // 0.02 USDT — small amount to stay well within LTV

    const posBefore = await getPositionData(publicClient, nftId);
    const txHash = await sendTxWithGasBoost(walletClient, publicClient, {
      to: VAULT_ADDR,
      data: encodeOperate(nftId, 0n, amount, address),
    });
    await waitAndLog(publicClient, txHash, "Borrow");

    const posAfter = await getPositionData(publicClient, nftId);
    console.log(`[Borrow] Debt: ${formatUnits(posBefore.borrow, 6)} → ${formatUnits(posAfter.borrow, 6)} USDT`);
    expect(posAfter.borrow).toBeGreaterThan(posBefore.borrow);
  });

  it("c. Repay USDT (repay 0.02 USDT)", async () => {
    const amount = 20_000n; // 0.02 USDT — repay what we borrowed in test b

    // Check USDT balance
    const usdtBal = (await publicClient.readContract({
      address: USDT_ADDR, abi: erc20Abi, functionName: "balanceOf", args: [address],
    })) as bigint;
    if (usdtBal < amount) {
      console.log(`[Repay] SKIP — insufficient USDT balance: ${formatUnits(usdtBal, 6)}`);
      return;
    }

    // 1. Approve USDT for vault
    const allowance = (await publicClient.readContract({
      address: USDT_ADDR, abi: erc20Abi, functionName: "allowance", args: [address, VAULT_ADDR],
    })) as bigint;

    if (allowance < amount) {
      console.log("[Repay] Approving USDT...");
      const approveTx = await sendTxWithGasBoost(walletClient, publicClient, {
        to: USDT_ADDR,
        data: encodeApprove(VAULT_ADDR, amount * 100n),
      });
      await waitAndLog(publicClient, approveTx, "Repay-Approve");
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      console.log(`[Repay] Allowance sufficient: ${allowance}`);
    }

    // 2. Repay — negative debtDelta
    const posBefore = await getPositionData(publicClient, nftId);
    const txHash = await sendTxWithGasBoost(walletClient, publicClient, {
      to: VAULT_ADDR,
      data: encodeOperate(nftId, 0n, -amount, address),
    });
    await waitAndLog(publicClient, txHash, "Repay");

    const posAfter = await getPositionData(publicClient, nftId);
    console.log(`[Repay] Debt: ${formatUnits(posBefore.borrow, 6)} → ${formatUnits(posAfter.borrow, 6)} USDT`);
    expect(posAfter.borrow).toBeLessThan(posBefore.borrow);
  });

  it("d. Withdraw collateral (withdraw 0.01 XAUT)", async () => {
    const amount = 10_000n; // 0.01 XAUT — minimum allowed

    const posBefore = await getPositionData(publicClient, nftId);

    // Safety: don't withdraw more than what's available
    if (posBefore.supply < amount) {
      console.log(`[Withdraw] SKIP — insufficient collateral: ${formatUnits(posBefore.supply, 6)} XAUT`);
      return;
    }

    // Withdraw — negative collateralDelta
    const txHash = await sendTxWithGasBoost(walletClient, publicClient, {
      to: VAULT_ADDR,
      data: encodeOperate(nftId, -amount, 0n, address),
    });
    await waitAndLog(publicClient, txHash, "Withdraw");

    const posAfter = await getPositionData(publicClient, nftId);
    console.log(`[Withdraw] Collateral: ${formatUnits(posBefore.supply, 6)} → ${formatUnits(posAfter.supply, 6)} XAUT`);
    expect(posAfter.supply).toBeLessThan(posBefore.supply);
  });
});
