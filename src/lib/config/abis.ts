
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


