/**
 * Compound Bulker Contract Integration
 * 
 * The Bulker contract allows batching multiple Comet operations into a single transaction.
 * This module provides encoding functions for supply + borrow operations.
 * 
 * Bulker contract on Arbitrum: 0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d
 */
import { C_COMPOUND_ABI, C_COMPOUND_ADDR } from "@/lib/config/abis";
import { formatAddress } from "@/lib/utils";
import {
    type Address,
    type Hex,
    type PublicClient,
    encodeFunctionData,
    encodeAbiParameters,
    parseAbiParameters,
    stringToHex,
    padHex,
} from "viem";

// Bulker contract address on Arbitrum
export const BULKER_ADDRESS = "0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d" as const;

// Compound Comet (USDT market) on Arbitrum
const COMET_ADDRESS = formatAddress(C_COMPOUND_ADDR);

// Action constants as bytes32 - these match the Bulker contract's constants
// The Bulker uses string-encoded bytes32 values
export const ACTION_SUPPLY_ASSET = padHex(stringToHex("ACTION_SUPPLY_ASSET"), { size: 32 }) as Hex;
export const ACTION_WITHDRAW_ASSET = padHex(stringToHex("ACTION_WITHDRAW_ASSET"), { size: 32 }) as Hex;

// Bulker ABI - only the invoke function we need
export const BULKER_ABI = [
    {
        inputs: [
            { name: "actions", type: "bytes32[]" },
            { name: "data", type: "bytes[]" },
        ],
        name: "invoke",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
] as const;

/**
 * Encode a combined supply collateral + borrow operation for Compound via Bulker
 * 
 * This batches two actions:
 * 1. ACTION_SUPPLY_ASSET - Supply WBTC as collateral
 * 2. ACTION_WITHDRAW_ASSET - Withdraw (borrow) USDT
 * 
 * @param cometAddress - The Comet contract address
 * @param userAddress - The user's wallet address (destination for borrow)
 * @param collateralToken - The collateral token address (e.g., WBTC)
 * @param collateralAmount - Amount of collateral to supply
 * @param borrowToken - The token to borrow (e.g., USDT)
 * @param borrowAmount - Amount to borrow
 * @returns Encoded invoke function data
 */
export function encodeBulkerSupplyAndBorrow(
    cometAddress: Address,
    userAddress: Address,
    collateralToken: Address,
    collateralAmount: bigint,
    borrowToken: Address,
    borrowAmount: bigint
): Hex {
    // Encode supply action data: (comet, to, asset, amount)
    const supplyData = encodeAbiParameters(
        parseAbiParameters("address, address, address, uint256"),
        [cometAddress, userAddress, collateralToken, collateralAmount]
    );

    // Encode withdraw action data: (comet, to, asset, amount)
    const withdrawData = encodeAbiParameters(
        parseAbiParameters("address, address, address, uint256"),
        [cometAddress, userAddress, borrowToken, borrowAmount]
    );

    // Encode the invoke call with both actions
    return encodeFunctionData({
        abi: BULKER_ABI,
        functionName: "invoke",
        args: [
            [ACTION_SUPPLY_ASSET, ACTION_WITHDRAW_ASSET],
            [supplyData, withdrawData],
        ],
    });
}

/**
 * Encode the allow function to grant Bulker permission to manage user's Comet account
 * 
 * This must be called before the user's first Bulker transaction if they haven't
 * already granted permission.
 * 
 * @param cometAddress - The Comet contract address
 * @param manager - The address to grant permission (typically BULKER_ADDRESS)
 * @param isAllowed - Whether to allow or revoke permission
 * @returns Encoded allow function data
 */
export function encodeAllowAction(
    cometAddress: Address,
    manager: Address,
    isAllowed: boolean
): Hex {
    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "manager", type: "address" },
                    { name: "isAllowed", type: "bool" },
                ],
                name: "allow",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
        functionName: "allow",
        args: [manager, isAllowed],
    });
}

/**
 * Encode supply + borrow with allow action data for first-time users
 * 
 * Returns two separate calldata:
 * 1. allowData - To be sent to Comet to grant Bulker permission
 * 2. bulkerData - To be sent to Bulker for the supply + borrow operation
 * 
 * These can be bundled into a multicall or executed sequentially.
 * 
 * @param cometAddress - The Comet contract address
 * @param userAddress - The user's wallet address
 * @param collateralToken - The collateral token address
 * @param collateralAmount - Amount of collateral to supply
 * @param borrowToken - The token to borrow
 * @param borrowAmount - Amount to borrow
 * @returns Object with allowData and bulkerData
 */
export function encodeBulkerSupplyBorrowWithAllow(
    cometAddress: Address,
    userAddress: Address,
    collateralToken: Address,
    collateralAmount: bigint,
    borrowToken: Address,
    borrowAmount: bigint
): { allowData: Hex; bulkerData: Hex } {
    const allowData = encodeAllowAction(cometAddress, BULKER_ADDRESS as Address, true);
    const bulkerData = encodeBulkerSupplyAndBorrow(
        cometAddress,
        userAddress,
        collateralToken,
        collateralAmount,
        borrowToken,
        borrowAmount
    );

    return { allowData, bulkerData };
}

/**
 * Check if user has granted Bulker permission to manage their Comet account
 * 
 * @param publicClient - The viem PublicClient instance
 * @param cometAddress - The Comet contract address
 * @param userAddress - The user's wallet address
 * @returns True if Bulker is allowed to manage user's account
 */
export async function hasAllowance(
    publicClient: PublicClient,
    cometAddress: Address,
    userAddress: Address
): Promise<boolean> {
    try {
        const result = await publicClient.readContract({
            address: cometAddress,
            abi: [
                {
                    inputs: [
                        { name: "owner", type: "address" },
                        { name: "manager", type: "address" },
                    ],
                    name: "isAllowed",
                    outputs: [{ name: "", type: "bool" }],
                    stateMutability: "view",
                    type: "function",
                },
            ],
            functionName: "isAllowed",
            args: [userAddress, BULKER_ADDRESS as Address],
        });
        return result as boolean;
    } catch (error) {
        console.error("[BULKER] Error checking allowance:", error);
        return false;
    }
}
