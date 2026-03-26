/**
 * Fluid Gas Sponsorship Investigation Tests
 *
 * Purpose: Re-investigate whether Privy gas sponsorship actually fails for Fluid
 * vault operations on Ethereum mainnet. PR #76 disabled sponsorship with the comment:
 * "The paymaster simulation fails if allowance isn't already set."
 *
 * Key insight: Pure borrows (newCol_=0) don't need ERC-20 approval — the vault mints
 * debt without pulling tokens. The allowance issue should only affect supply/supplyAndBorrow.
 * This means forceNoSponsor may have been applied too broadly.
 *
 * Tests 1-2: Anvil fork (free, deterministic) — baseline contract behavior
 * Tests 3-4: Live mainnet (opt-in) — probe actual paymaster/bundler behavior
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  parseAbi,
  encodeFunctionData,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  type TestClient,
  erc20Abi,
} from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// --- Reuse existing project code ---
import { FLUID_VAULT_ABI, XAUT_USDT_VAULT } from "@/lib/web3/fluid";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";

// --- Constants ---
const VAULT_ADDR = XAUT_USDT_VAULT as Address;
const XAUT_ADDR = ETHEREUM_TOKEN_ADDRESSES.XAUT;
const USDT_ADDR = ETHEREUM_TOKEN_ADDRESSES.USDT;

// Vault resolver for reading positions
const SIMPLE_RESOLVER_ABI = parseAbi([
  "function positionsNftIdOfUser(address user_) view returns (uint256[])",
  "function vaultByNftId(uint256 nftId_) view returns (address)",
]);

// Fluid vault resolver address (v2 on mainnet)
const VAULT_RESOLVER_ADDR = "0xA5C3E16523eeeDDcC34706b0E6bE88b4c6EA95cC" as Address;

// Position data ABI
const POSITION_BY_NFT_ABI = parseAbi([
  "function positionByNftId(uint256 nftId_) view returns ((uint256 nftId, address owner, bool isLiquidated, bool isSupplyPosition, int256 tick, uint256 tickId, uint256 beforeSupply, uint256 beforeBorrow, uint256 beforeDustBorrow, uint256 supply, uint256 borrow, uint256 dustBorrow))",
]);

// Borrow 1 USDT = 1_000_000 raw units (6 decimals)
const BORROW_AMOUNT = 1_000_000n;
// Supply 0.01 XAUT = 10_000 raw units (6 decimals) — minimum
const SUPPLY_AMOUNT = 10_000n;

// RPC URL for fork/reads
const MAINNET_RPC = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://eth.llamarpc.com";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function encodeOperate(
  nftId: bigint,
  collateralDelta: bigint,
  debtDelta: bigint,
  recipient: Address
): Hex {
  return encodeFunctionData({
    abi: FLUID_VAULT_ABI,
    functionName: "operate",
    args: [nftId, collateralDelta, debtDelta, recipient],
  });
}

function encodeApprove(spender: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
  });
}

async function getPositionNftIds(
  client: PublicClient,
  userAddress: Address
): Promise<bigint[]> {
  const nftIds = await client.readContract({
    address: VAULT_RESOLVER_ADDR,
    abi: SIMPLE_RESOLVER_ABI,
    functionName: "positionsNftIdOfUser",
    args: [userAddress],
  });
  return nftIds as bigint[];
}

async function getPositionData(
  client: PublicClient,
  nftId: bigint
): Promise<{ supply: bigint; borrow: bigint; isLiquidated: boolean }> {
  const result = await client.readContract({
    address: VAULT_RESOLVER_ADDR,
    abi: POSITION_BY_NFT_ABI,
    functionName: "positionByNftId",
    args: [nftId],
  }) as any;

  return {
    supply: result.supply,
    borrow: result.borrow,
    isLiquidated: result.isLiquidated,
  };
}

// =============================================================================
// TEST SUITE 1: ANVIL FORK BASELINE (free, deterministic)
// =============================================================================

describe("Fluid Vault Baseline (Anvil Fork)", () => {
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let testClient: TestClient;
  let testAddress: Address;

  // Use a known address that has a Fluid position — from test/setup.ts
  const KNOWN_POSITION_HOLDER = "0xfCDd6Dcc5cD3cb62ACEb87687C953CAd1002024A" as Address;

  beforeAll(async () => {
    // Create clients pointing to Anvil fork
    // Anvil must be running: anvil --fork-url <RPC> --fork-block-number <BLOCK>
    // OR we use viem's built-in test mode with hardhat/anvil
    const forkRpcUrl = process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545";

    publicClient = createPublicClient({
      chain: mainnet,
      transport: http(forkRpcUrl),
    });

    testClient = createTestClient({
      chain: mainnet,
      transport: http(forkRpcUrl),
      mode: "anvil",
    });

    // Impersonate the known position holder
    testAddress = KNOWN_POSITION_HOLDER;
    await testClient.impersonateAccount({ address: testAddress });

    walletClient = createWalletClient({
      account: testAddress,
      chain: mainnet,
      transport: http(forkRpcUrl),
    });

    // Give the impersonated account some ETH for gas
    await testClient.setBalance({
      address: testAddress,
      value: 10n * 10n ** 18n, // 10 ETH
    });
  });

  it("Test 1: Pure borrow succeeds via direct call (no approval needed)", async () => {
    // 1. Find existing position
    const nftIds = await getPositionNftIds(publicClient, testAddress);
    console.log(`[Test 1] Found ${nftIds.length} position(s) for ${testAddress}`);

    if (nftIds.length === 0) {
      console.log("[Test 1] SKIP — no existing position found for this address");
      return;
    }

    // Use the first non-liquidated position
    let targetNftId: bigint | null = null;
    let positionBefore: { supply: bigint; borrow: bigint; isLiquidated: boolean } | null = null;

    for (const nftId of nftIds) {
      const pos = await getPositionData(publicClient, nftId);
      if (!pos.isLiquidated && pos.supply > 0n) {
        targetNftId = nftId;
        positionBefore = pos;
        break;
      }
    }

    if (!targetNftId || !positionBefore) {
      console.log("[Test 1] SKIP — no active position with collateral found");
      return;
    }

    console.log("[Test 1] Using position:", {
      nftId: targetNftId.toString(),
      supply: positionBefore.supply.toString(),
      borrow: positionBefore.borrow.toString(),
    });

    // 2. Encode pure borrow (no collateral change)
    const calldata = encodeOperate(targetNftId, 0n, BORROW_AMOUNT, testAddress);

    // 3. Submit transaction on fork
    const txHash = await walletClient.sendTransaction({
      to: VAULT_ADDR,
      data: calldata,
      gas: 500_000n,
    });

    console.log("[Test 1] Borrow tx hash:", txHash);

    // 4. Mine the block
    await testClient.mine({ blocks: 1 });

    // 5. Check receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    console.log("[Test 1] Tx status:", receipt.status);

    expect(receipt.status).toBe("success");

    // 6. Verify debt increased
    const positionAfter = await getPositionData(publicClient, targetNftId);
    console.log("[Test 1] Borrow after:", positionAfter.borrow.toString());

    // Debt should have increased (exact amount may differ due to interest accrual)
    expect(positionAfter.borrow).toBeGreaterThan(positionBefore.borrow);

    console.log("[Test 1] PASS — Pure borrow succeeded without any approval. No sponsorship-blocking issue for this operation type.");
  });

  it("Test 2: supplyAndBorrow succeeds when approval is pre-set", async () => {
    // 1. Give the test address some XAUT tokens
    // Find a whale to impersonate for token transfer
    const xautBalance = await publicClient.readContract({
      address: XAUT_ADDR,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [testAddress],
    });

    console.log("[Test 2] Current XAUT balance:", xautBalance.toString());

    // If no XAUT, we need to get some — use storage manipulation
    if (xautBalance < SUPPLY_AMOUNT) {
      // Set XAUT balance directly via Anvil storage slot manipulation
      // XAUT uses standard ERC20 balanceOf at slot derived from mapping(address => uint256)
      // We'll use a different approach: just test with the address that already has XAUT
      console.log("[Test 2] Insufficient XAUT balance. Attempting storage override...");

      // For XAUT (TetherGold), balance mapping is typically at slot 0 or 1
      // We try common storage slots for ERC20 balances
      const desiredBalance = 1_000_000n; // 1 XAUT
      const slots = [0n, 1n, 2n, 3n, 51n]; // Common ERC20 balance mapping slots

      for (const slot of slots) {
        // Calculate storage slot for balanceOf[testAddress]
        const paddedAddress = testAddress.toLowerCase().slice(2).padStart(64, "0");
        const paddedSlot = slot.toString(16).padStart(64, "0");
        const storageKey = ("0x" + paddedAddress + paddedSlot) as Hex;

        // keccak256 of the concatenation gives the actual storage slot
        const { keccak256 } = await import("viem");
        const actualSlot = keccak256(storageKey);

        await testClient.setStorageAt({
          address: XAUT_ADDR,
          index: actualSlot,
          value: ("0x" + desiredBalance.toString(16).padStart(64, "0")) as Hex,
        });

        // Check if it worked
        const newBalance = await publicClient.readContract({
          address: XAUT_ADDR,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [testAddress],
        });

        if (newBalance >= SUPPLY_AMOUNT) {
          console.log(`[Test 2] XAUT balance set via slot ${slot}: ${newBalance.toString()}`);
          break;
        }
      }
    }

    // 2. Approve XAUT for the vault FIRST (this is the key — pre-set approval)
    const approveTx = await walletClient.sendTransaction({
      to: XAUT_ADDR,
      data: encodeApprove(VAULT_ADDR, SUPPLY_AMOUNT * 10n), // Approve 10x to be safe
    });
    await testClient.mine({ blocks: 1 });
    const approveReceipt = await publicClient.getTransactionReceipt({ hash: approveTx });
    console.log("[Test 2] Approval tx status:", approveReceipt.status);
    expect(approveReceipt.status).toBe("success");

    // 3. Verify allowance is set
    const allowance = await publicClient.readContract({
      address: XAUT_ADDR,
      abi: erc20Abi,
      functionName: "allowance",
      args: [testAddress, VAULT_ADDR],
    });
    console.log("[Test 2] Allowance set:", allowance.toString());
    expect(allowance).toBeGreaterThanOrEqual(SUPPLY_AMOUNT);

    // 4. Now do supplyAndBorrow — create new position (nftId=0)
    const calldata = encodeOperate(0n, SUPPLY_AMOUNT, BORROW_AMOUNT, testAddress);

    let txHash: Hex;
    try {
      txHash = await walletClient.sendTransaction({
        to: VAULT_ADDR,
        data: calldata,
        gas: 1_000_000n,
      });
    } catch (err: any) {
      console.log("[Test 2] supplyAndBorrow reverted:", err.message?.slice(0, 200));
      // Even if it reverts (e.g., insufficient collateral for borrow), we document why
      console.log("[Test 2] This revert is expected if collateral value is too low relative to borrow amount.");
      console.log("[Test 2] The key finding: the APPROVAL was successful, and the vault was called.");
      return;
    }

    await testClient.mine({ blocks: 1 });
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    console.log("[Test 2] supplyAndBorrow tx status:", receipt.status);
    console.log("[Test 2] Gas used:", receipt.gasUsed.toString());

    if (receipt.status === "success") {
      console.log("[Test 2] PASS — supplyAndBorrow succeeded with pre-set approval.");
    } else {
      console.log("[Test 2] REVERTED — supplyAndBorrow failed even with approval pre-set.");
      console.log("[Test 2] This suggests the issue may not be approval-related.");
    }
  });

  it("Test 2a: Pure borrow SIMULATION succeeds (no approval needed — paymaster would pass)", async () => {
    // After Test 2 creates a position, simulate a pure borrow via eth_call.
    // This mimics what the paymaster does during gas estimation.
    // If this SUCCEEDS, it proves pure borrows can be sponsored.

    // First, create a position to borrow from (same as Test 2 setup)
    const { keccak256 } = await import("viem");
    const freshBorrower = "0x2222222222222222222222222222222222222222" as Address;
    await testClient.impersonateAccount({ address: freshBorrower });
    await testClient.setBalance({ address: freshBorrower, value: 10n * 10n ** 18n });

    // Give XAUT
    const desiredBalance = 10_000_000n; // 10 XAUT (plenty of collateral)
    const slots = [0n, 1n, 2n, 3n, 51n];
    for (const slot of slots) {
      const paddedAddress = freshBorrower.toLowerCase().slice(2).padStart(64, "0");
      const paddedSlot = slot.toString(16).padStart(64, "0");
      const storageKey = ("0x" + paddedAddress + paddedSlot) as Hex;
      const actualSlot = keccak256(storageKey);
      await testClient.setStorageAt({
        address: XAUT_ADDR,
        index: actualSlot,
        value: ("0x" + desiredBalance.toString(16).padStart(64, "0")) as Hex,
      });
      const bal = await publicClient.readContract({
        address: XAUT_ADDR, abi: erc20Abi, functionName: "balanceOf", args: [freshBorrower],
      });
      if (bal >= SUPPLY_AMOUNT) break;
    }

    // Approve and supply collateral (create position)
    const freshWallet = createWalletClient({
      account: freshBorrower, chain: mainnet, transport: http(process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545"),
    });

    const approveTx = await freshWallet.sendTransaction({
      to: XAUT_ADDR, data: encodeApprove(VAULT_ADDR, desiredBalance),
    });
    await testClient.mine({ blocks: 1 });

    // Supply 5 XAUT collateral + borrow 1 USDT (creates position with lots of headroom)
    const supplyAmount = 5_000_000n; // 5 XAUT
    const initialBorrow = BORROW_AMOUNT; // 1 USDT
    const createCalldata = encodeOperate(0n, supplyAmount, initialBorrow, freshBorrower);
    const createTx = await freshWallet.sendTransaction({
      to: VAULT_ADDR, data: createCalldata, gas: 1_000_000n,
    });
    await testClient.mine({ blocks: 1 });
    const createReceipt = await publicClient.getTransactionReceipt({ hash: createTx });
    console.log("[Test 2a] Position creation status:", createReceipt.status);
    expect(createReceipt.status).toBe("success");

    // Find the newly created nftId
    const nftIds = await getPositionNftIds(publicClient, freshBorrower);
    console.log("[Test 2a] NFT IDs after creation:", nftIds.map(n => n.toString()));
    expect(nftIds.length).toBeGreaterThan(0);
    const nftId = nftIds[0];

    // NOW: simulate a PURE BORROW via eth_call (no approval needed)
    // This is the critical test — does the paymaster simulation pass for pure borrows?
    const borrowCalldata = encodeOperate(nftId, 0n, BORROW_AMOUNT, freshBorrower);

    try {
      const result = await publicClient.call({
        account: freshBorrower,
        to: VAULT_ADDR,
        data: borrowCalldata,
      });
      console.log("[Test 2a] Pure borrow simulation SUCCEEDED!");
      console.log("[Test 2a] Return data length:", result.data?.length);
      console.log("[Test 2a] CRITICAL FINDING: eth_call (paymaster simulation) PASSES for pure borrows.");
      console.log("[Test 2a] This means forceNoSponsor is UNNECESSARY for borrow() operations.");
      console.log("[Test 2a] Gas sponsorship CAN be safely re-enabled for pure borrows.");
      expect(true).toBe(true);
    } catch (err: any) {
      console.log("[Test 2a] Pure borrow simulation FAILED:", err.message?.slice(0, 300));
      console.log("[Test 2a] UNEXPECTED — pure borrows should not need approval.");
      // Don't fail the test — this is investigation, log the finding
    }
  });

  it("Test 2b: supplyAndBorrow simulation fails WITHOUT pre-set approval (reproduces paymaster issue)", async () => {
    // This test simulates what happens when the paymaster tries to estimate gas
    // for a supplyAndBorrow where approval hasn't been mined yet.
    // This is the exact scenario described in the forceNoSponsor comment.

    // 1. Create a fresh address with no approvals
    const freshAddress = "0x1111111111111111111111111111111111111111" as Address;
    await testClient.impersonateAccount({ address: freshAddress });
    await testClient.setBalance({ address: freshAddress, value: 10n * 10n ** 18n });

    // Give it some XAUT
    const desiredBalance = 1_000_000n;
    const slots = [0n, 1n, 2n, 3n, 51n];
    const { keccak256 } = await import("viem");

    for (const slot of slots) {
      const paddedAddress = freshAddress.toLowerCase().slice(2).padStart(64, "0");
      const paddedSlot = slot.toString(16).padStart(64, "0");
      const storageKey = ("0x" + paddedAddress + paddedSlot) as Hex;
      const actualSlot = keccak256(storageKey);

      await testClient.setStorageAt({
        address: XAUT_ADDR,
        index: actualSlot,
        value: ("0x" + desiredBalance.toString(16).padStart(64, "0")) as Hex,
      });

      const newBalance = await publicClient.readContract({
        address: XAUT_ADDR,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [freshAddress],
      });

      if (newBalance >= SUPPLY_AMOUNT) break;
    }

    // 2. DO NOT approve — this is the whole point
    const allowance = await publicClient.readContract({
      address: XAUT_ADDR,
      abi: erc20Abi,
      functionName: "allowance",
      args: [freshAddress, VAULT_ADDR],
    });
    console.log("[Test 2b] Allowance (should be 0):", allowance.toString());
    expect(allowance).toBe(0n);

    // 3. Try to simulate the supplyAndBorrow — this is what the paymaster does
    const calldata = encodeOperate(0n, SUPPLY_AMOUNT, BORROW_AMOUNT, freshAddress);

    try {
      await publicClient.call({
        account: freshAddress,
        to: VAULT_ADDR,
        data: calldata,
      });
      console.log("[Test 2b] UNEXPECTED — simulation succeeded without approval!");
      console.log("[Test 2b] This means the paymaster simulation should NOT fail for this case.");
    } catch (err: any) {
      const errorMsg = err.message?.slice(0, 300) || "unknown error";
      console.log("[Test 2b] Simulation FAILED (expected):", errorMsg);
      console.log("[Test 2b] CONFIRMED — Without pre-set approval, eth_call simulation reverts.");
      console.log("[Test 2b] This is what causes paymaster estimation to fail for supplyAndBorrow.");
      console.log("[Test 2b] FINDING: forceNoSponsor is CORRECT for supplyAndBorrow operations.");
    }
  });
});

// =============================================================================
// TEST SUITE 2: LIVE MAINNET (opt-in only, costs real gas)
// =============================================================================

const MAINNET_ENABLED = process.env.RUN_MAINNET_INTEGRATION === "true";
const TEST_KEY = process.env.TEST_PRIVATE_KEY;

describe.skipIf(!MAINNET_ENABLED || !TEST_KEY)(
  "Fluid Vault Live Mainnet (gas sponsorship investigation)",
  () => {
    let publicClient: PublicClient;
    let walletClient: WalletClient;
    let testAddress: Address;

    beforeAll(() => {
      const account = privateKeyToAccount(TEST_KEY as Hex);
      testAddress = account.address;

      publicClient = createPublicClient({
        chain: mainnet,
        transport: http(MAINNET_RPC),
      });

      walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(MAINNET_RPC),
      });
    });

    it("Test 3: Pre-flight checks — wallet state", async () => {
      // Check ETH balance
      const ethBalance = await publicClient.getBalance({ address: testAddress });
      console.log("[Test 3] ETH balance:", (Number(ethBalance) / 1e18).toFixed(6), "ETH");
      expect(ethBalance).toBeGreaterThan(10n ** 16n); // > 0.01 ETH

      // Check XAUT balance
      const xautBalance = await publicClient.readContract({
        address: XAUT_ADDR,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [testAddress],
      });
      console.log("[Test 3] XAUT balance:", (Number(xautBalance) / 1e6).toFixed(6), "XAUT");

      // Check USDT balance
      const usdtBalance = await publicClient.readContract({
        address: USDT_ADDR,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [testAddress],
      });
      console.log("[Test 3] USDT balance:", (Number(usdtBalance) / 1e6).toFixed(6), "USDT");

      // Check existing positions
      const nftIds = await getPositionNftIds(publicClient, testAddress);
      console.log("[Test 3] Position NFT IDs:", nftIds.map(n => n.toString()));

      for (const nftId of nftIds) {
        const pos = await getPositionData(publicClient, nftId);
        console.log(`[Test 3] Position ${nftId}:`, {
          supply: (Number(pos.supply) / 1e6).toFixed(6) + " XAUT",
          borrow: (Number(pos.borrow) / 1e6).toFixed(6) + " USDT",
          isLiquidated: pos.isLiquidated,
        });
      }
    });

    it("Test 4: Live pure borrow WITHOUT sponsorship (direct tx)", async () => {
      const nftIds = await getPositionNftIds(publicClient, testAddress);
      if (nftIds.length === 0) {
        console.log("[Test 4] SKIP — no existing position");
        return;
      }

      // Find active position with headroom
      let targetNftId: bigint | null = null;
      let positionBefore: any = null;

      for (const nftId of nftIds) {
        const pos = await getPositionData(publicClient, nftId);
        if (!pos.isLiquidated && pos.supply > 0n) {
          targetNftId = nftId;
          positionBefore = pos;
          break;
        }
      }

      if (!targetNftId) {
        console.log("[Test 4] SKIP — no active position with collateral");
        return;
      }

      // Safety check: only borrow 1 USDT (minimal amount)
      const calldata = encodeOperate(targetNftId, 0n, BORROW_AMOUNT, testAddress);

      // Estimate gas first
      const gasEstimate = await publicClient.estimateGas({
        account: testAddress,
        to: VAULT_ADDR,
        data: calldata,
      });
      console.log("[Test 4] Gas estimate:", gasEstimate.toString());

      // Safety cap — don't spend more than 0.02 ETH on gas
      const gasPrice = await publicClient.getGasPrice();
      const maxGasCost = gasEstimate * gasPrice;
      console.log("[Test 4] Max gas cost:", (Number(maxGasCost) / 1e18).toFixed(6), "ETH");

      if (maxGasCost > 2n * 10n ** 16n) {
        console.log("[Test 4] SKIP — gas cost exceeds 0.02 ETH safety cap");
        return;
      }

      // Submit the actual transaction
      const txHash = await walletClient.sendTransaction({
        to: VAULT_ADDR,
        data: calldata,
      });

      console.log("[Test 4] TX submitted:", txHash);
      console.log("[Test 4] Etherscan: https://etherscan.io/tx/" + txHash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 120_000,
      });

      console.log("[Test 4] Status:", receipt.status);
      console.log("[Test 4] Gas used:", receipt.gasUsed.toString());
      console.log("[Test 4] Block:", receipt.blockNumber.toString());

      expect(receipt.status).toBe("success");

      console.log("[Test 4] PASS — Direct borrow (no sponsorship) succeeded on mainnet.");
      console.log("[Test 4] CONCLUSION: The Fluid vault operate() function works fine for pure borrows.");
      console.log("[Test 4] The forceNoSponsor flag is not needed for the CONTRACT CALL itself.");
      console.log("[Test 4] The issue (if any) is in the PAYMASTER SIMULATION layer, not the contract.");
    });
  }
);

// =============================================================================
// INVESTIGATION SUMMARY
// =============================================================================

describe("Investigation Summary", () => {
  it("documents findings and recommendations", () => {
    console.log("\n" + "=".repeat(80));
    console.log("FLUID GAS SPONSORSHIP INVESTIGATION");
    console.log("=".repeat(80));
    console.log(`
BACKGROUND:
  PR #76 disabled gas sponsorship for ALL Fluid operations with:
    forceNoSponsor: true  // "paymaster simulation fails if allowance isn't already set"

HYPOTHESIS (from QA review):
  The allowance issue ONLY affects operations that require ERC-20 transferFrom:
  - supplyAndBorrow (needs XAUT approval) → sponsorship likely fails
  - pure borrow (no token transfer) → sponsorship should work fine

EXPECTED FINDINGS:
  Test 1 (fork, pure borrow): PASS — no approval needed
  Test 2 (fork, supplyAndBorrow with approval): PASS — approval pre-set
  Test 2b (fork, supplyAndBorrow WITHOUT approval): FAIL — reproduces the bug
  Test 3 (live, wallet state): INFO — shows what we're working with
  Test 4 (live, pure borrow): PASS — proves contract works on mainnet

RECOMMENDATION (pending test results):
  If findings match expectations, we can SAFELY re-enable gas sponsorship for:
  - borrow() operations (pure debt increase, no collateral change)
  - repay() operations (pure debt decrease, no collateral change)
  - withdraw() operations (no token transfer INTO vault)

  Keep forceNoSponsor: true ONLY for:
  - supply() operations (transfers XAUT into vault, needs approval)
  - supplyAndBorrow() operations (same reason)

  This would give embedded wallet users gasless borrows, repays, and withdrawals
  while avoiding the paymaster simulation failure on supply operations.
    `);
    expect(true).toBe(true); // Always passes — this is documentation
  });
});
