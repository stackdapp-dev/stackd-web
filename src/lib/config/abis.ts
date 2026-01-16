
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

// ABI for getVaultEntireData - returns VaultEntireData with borrow rate info
// Verified working structure from Etherscan contract source
// borrowRateVault is in basis points (10000 = 100%, so 515 = 5.15% APR)
export const FLUID_VAULT_RESOLVER_ABI = [
  {
    inputs: [{ name: "vault_", type: "address" }],
    name: "getVaultEntireData",
    outputs: [
      {
        name: "vaultData_",
        type: "tuple",
        components: [
          { name: "vault", type: "address" },
          // ConstantViews struct (from IFluidVaultT1)
          {
            name: "constantVariables", type: "tuple", components: [
              { name: "liquidity", type: "address" },
              { name: "factory", type: "address" },
              { name: "adminImplementation", type: "address" },
              { name: "secondaryImplementation", type: "address" },
              { name: "supplyToken", type: "address" },
              { name: "borrowToken", type: "address" },
              { name: "supplyDecimals", type: "uint8" },
              { name: "borrowDecimals", type: "uint8" },
              { name: "vaultId", type: "uint256" },
              { name: "liquiditySupplyExchangePriceSlot", type: "bytes32" },
              { name: "liquidityBorrowExchangePriceSlot", type: "bytes32" },
              { name: "liquidityUserSupplySlot", type: "bytes32" },
              { name: "liquidityUserBorrowSlot", type: "bytes32" },
            ]
          },
          // Configs struct
          {
            name: "configs", type: "tuple", components: [
              { name: "supplyRateMagnifier", type: "uint16" },
              { name: "borrowRateMagnifier", type: "uint16" },
              { name: "collateralFactor", type: "uint16" },
              { name: "liquidationThreshold", type: "uint16" },
              { name: "liquidationMaxLimit", type: "uint16" },
              { name: "withdrawalGap", type: "uint16" },
              { name: "liquidationPenalty", type: "uint16" },
              { name: "borrowFee", type: "uint16" },
              { name: "oracle", type: "address" },
              { name: "oraclePrice", type: "uint256" },
              { name: "rebalancer", type: "address" },
            ]
          },
          // ExchangePricesAndRates struct - contains borrowRateVault!
          {
            name: "exchangePricesAndRates", type: "tuple", components: [
              { name: "lastStoredLiquiditySupplyExchangePrice", type: "uint256" },
              { name: "lastStoredLiquidityBorrowExchangePrice", type: "uint256" },
              { name: "lastStoredVaultSupplyExchangePrice", type: "uint256" },
              { name: "lastStoredVaultBorrowExchangePrice", type: "uint256" },
              { name: "liquiditySupplyExchangePrice", type: "uint256" },
              { name: "liquidityBorrowExchangePrice", type: "uint256" },
              { name: "vaultSupplyExchangePrice", type: "uint256" },
              { name: "vaultBorrowExchangePrice", type: "uint256" },
              { name: "supplyRateVault", type: "uint256" },
              { name: "borrowRateVault", type: "uint256" },
              { name: "supplyRateLiquidity", type: "uint256" },
              { name: "borrowRateLiquidity", type: "uint256" },
              { name: "rewardsRate", type: "uint256" },
            ]
          },
          // TotalSupplyAndBorrow struct
          {
            name: "totalSupplyAndBorrow", type: "tuple", components: [
              { name: "totalSupplyVault", type: "uint256" },
              { name: "totalBorrowVault", type: "uint256" },
              { name: "totalSupplyLiquidity", type: "uint256" },
              { name: "totalBorrowLiquidity", type: "uint256" },
              { name: "absorbedSupply", type: "uint256" },
              { name: "absorbedBorrow", type: "uint256" },
            ]
          },
          // LimitsAndAvailability struct (7 fields)
          {
            name: "limitsAndAvailability", type: "tuple", components: [
              { name: "withdrawLimit", type: "uint256" },
              { name: "withdrawableUntilLimit", type: "uint256" },
              { name: "withdrawable", type: "uint256" },
              { name: "borrowLimit", type: "uint256" },
              { name: "borrowableUntilLimit", type: "uint256" },
              { name: "borrowable", type: "uint256" },
              { name: "minimumBorrowing", type: "uint256" },
            ]
          },
          // VaultState struct with nested CurrentBranchState
          {
            name: "vaultState", type: "tuple", components: [
              { name: "totalPositions", type: "uint256" },
              { name: "topTick", type: "int256" },
              { name: "currentBranch", type: "uint256" },
              { name: "totalBranch", type: "uint256" },
              { name: "totalBorrow", type: "uint256" },
              { name: "totalSupply", type: "uint256" },
              { name: "currentBranchState", type: "tuple", components: [
                { name: "status", type: "uint256" },
                { name: "minimaTick", type: "int256" },
                { name: "debtFactor", type: "uint256" },
                { name: "partials", type: "uint256" },
                { name: "debtLiquidity", type: "uint256" },
                { name: "baseBranchId", type: "uint256" },
                { name: "baseBranchMinima", type: "int256" },
              ]},
            ]
          },
          // UserSupplyData struct (9 fields)
          {
            name: "liquidityUserSupplyData", type: "tuple", components: [
              { name: "modeWithInterest", type: "bool" },
              { name: "supply", type: "uint256" },
              { name: "withdrawalLimit", type: "uint256" },
              { name: "lastUpdateTimestamp", type: "uint256" },
              { name: "expandPercent", type: "uint256" },
              { name: "expandDuration", type: "uint256" },
              { name: "baseWithdrawalLimit", type: "uint256" },
              { name: "withdrawableUntilLimit", type: "uint256" },
              { name: "withdrawable", type: "uint256" },
            ]
          },
          // UserBorrowData struct (10 fields)
          {
            name: "liquidityUserBorrowData", type: "tuple", components: [
              { name: "modeWithInterest", type: "bool" },
              { name: "borrow", type: "uint256" },
              { name: "borrowLimit", type: "uint256" },
              { name: "lastUpdateTimestamp", type: "uint256" },
              { name: "expandPercent", type: "uint256" },
              { name: "expandDuration", type: "uint256" },
              { name: "baseBorrowLimit", type: "uint256" },
              { name: "maxBorrowLimit", type: "uint256" },
              { name: "borrowableUntilLimit", type: "uint256" },
              { name: "borrowable", type: "uint256" },
            ]
          },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
