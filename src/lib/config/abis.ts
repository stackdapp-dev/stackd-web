
// Contract ABIs and addresses for Compound V3 and tokens

export const C_COMPOUND_ADDR = "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07" as const;

export const C_COMPOUND_ABI = [
  {
    inputs: [{ type: "address" }, { type: "address" }],
    name: "userCollateral",
    outputs: [
      { name: "balance", type: "uint128" },
      { name: "_reserved", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "borrowBalanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getAssetInfoByAddress",
    outputs: [
      { name: "offset", type: "uint8" },
      { name: "asset", type: "address" },
      { name: "priceFeed", type: "address" },
      { name: "scale", type: "uint64" },
      { name: "borrowCollateralFactor", type: "uint64" },
      { name: "liquidateCollateralFactor", type: "uint64" },
      { name: "liquidationFactor", type: "uint64" },
      { name: "supplyCap", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUtilization",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "utilization", type: "uint256" }],
    name: "getBorrowRate",
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Standard ERC20 ABI for token approvals
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Fluid VaultResolver ABI - for reading position data
export const FLUID_VAULT_RESOLVER_ADDR =
  "0x93CAB6529aD849b2583EBAe32D13817A2F38cEb4" as const; // Fluid VaultResolver on Ethereum mainnet

export const FLUID_VAULT_RESOLVER_ABI = [
  {
    inputs: [{ name: "user_", type: "address" }],
    name: "positionsByUser",
    outputs: [
      {
        name: "userPositions_",
        type: "tuple[]",
        components: [
          { name: "nftId", type: "uint256" },
          { name: "supply", type: "uint256" },
          { name: "borrow", type: "uint256" },
        ],
      },
      {
        name: "vaultsData_",
        type: "tuple[]",
        components: [
          { name: "vault", type: "address" },
          { name: "supplyToken", type: "address" },
          { name: "borrowToken", type: "address" },
          { name: "collateralFactor", type: "uint256" },
          { name: "liquidationThreshold", type: "uint256" },
          { name: "supplyRate", type: "uint256" },
          { name: "borrowRate", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "nftId_", type: "uint256" }],
    name: "positionByNftId",
    outputs: [
      {
        name: "userPosition_",
        type: "tuple",
        components: [
          { name: "nftId", type: "uint256" },
          { name: "supply", type: "uint256" },
          { name: "borrow", type: "uint256" },
        ],
      },
      {
        name: "vaultData_",
        type: "tuple",
        components: [
          { name: "vault", type: "address" },
          { name: "supplyToken", type: "address" },
          { name: "borrowToken", type: "address" },
          { name: "collateralFactor", type: "uint256" },
          { name: "liquidationThreshold", type: "uint256" },
          { name: "supplyRate", type: "uint256" },
          { name: "borrowRate", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
