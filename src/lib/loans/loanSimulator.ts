/**
 * Loan Simulator - Pure calculation functions for simulating loan scenarios
 *
 * These functions are pure (no side effects) and can be used for:
 * - Real-time loan simulation
 * - Stress testing price scenarios
 * - Calculating loan metrics
 */

import {
  STACKD_ADDITIONAL_APR,
  calculateMonthlyStackdFee,
  calculateYearlyStackdFee,
} from "./stackdFee";

export type HealthStatus = "safe" | "warning" | "danger";

export interface LoanState {
  collateralWbtc: number;
  collateralUsd: number;
  borrowedUsd: number;
  btcPrice: number;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
}

export interface SimulationResult {
  ltv: number;
  borrowableAmount: number;
  borrowCapacity: number;
  liquidationPrice: number;
  healthFactor: number;
  healthStatus: HealthStatus;
  monthlyInterest: number;
  yearlyInterest: number;
  availableToBorrow: number;
  // Stack'd fee breakdown
  marketApr: number;
  stackdFeeApr: number;
  totalApr: number;
  monthlyStackdFee: number;
  yearlyStackdFee: number;
  monthlyMarketInterest: number;
  yearlyMarketInterest: number;
}

export interface SimulationParams {
  collateralWbtc: number;
  borrowedUsd: number;
  btcPrice: number;
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
}

/**
 * Calculate collateral value in USD
 * @param wbtcAmount - Amount of WBTC
 * @param btcPrice - Current BTC price in USD
 * @returns Collateral value in USD
 */
export function calculateCollateralValueUsd(
  wbtcAmount: number,
  btcPrice: number
): number {
  if (wbtcAmount < 0 || btcPrice < 0) return 0;
  return wbtcAmount * btcPrice;
}

/**
 * Calculate Loan-to-Value ratio
 * @param borrowedUsd - Total borrowed amount in USD
 * @param collateralUsd - Total collateral value in USD
 * @returns LTV as a percentage (0-100+)
 */
export function calculateLtv(
  borrowedUsd: number,
  collateralUsd: number
): number {
  if (collateralUsd <= 0) return 0;
  if (borrowedUsd < 0) return 0;
  return (borrowedUsd / collateralUsd) * 100;
}

/**
 * Calculate total yearly interest on borrowed amount
 * @param principal - Borrowed amount in USD
 * @param apr - Annual percentage rate (e.g., 5.5 for 5.5%)
 * @returns Yearly interest in USD
 */
export function calculateTotalInterest(
  principal: number,
  apr: number
): number {
  if (principal < 0 || apr < 0) return 0;
  return principal * (apr / 100);
}

/**
 * Calculate monthly interest payment
 * @param principal - Borrowed amount in USD
 * @param apr - Annual percentage rate (e.g., 5.5 for 5.5%)
 * @returns Monthly interest in USD
 */
export function calculateMonthlyPayment(
  principal: number,
  apr: number
): number {
  return calculateTotalInterest(principal, apr) / 12;
}

/**
 * Calculate the BTC price at which liquidation would occur
 * @param borrowedUsd - Total borrowed amount in USD
 * @param collateralWbtc - Amount of WBTC collateral
 * @param liquidationRatio - Liquidation threshold (e.g., 85 for 85%)
 * @returns BTC price at liquidation
 */
export function calculateLiquidationPrice(
  borrowedUsd: number,
  collateralWbtc: number,
  liquidationRatio: number
): number {
  if (collateralWbtc <= 0 || borrowedUsd <= 0) return 0;
  if (liquidationRatio <= 0) return 0;
  // Liquidation occurs when: borrowedUsd / (collateralWbtc * btcPrice) >= liquidationRatio / 100
  // Solving for btcPrice: btcPrice <= borrowedUsd / (collateralWbtc * liquidationRatio / 100)
  const liquidationCollateralValue = borrowedUsd / (liquidationRatio / 100);
  return liquidationCollateralValue / collateralWbtc;
}

/**
 * Calculate health factor
 * Health Factor = Liquidation Ratio / Current LTV
 * When HF > 1, position is safe
 * When HF < 1, position is at risk of liquidation
 * @param collateralUsd - Collateral value in USD
 * @param borrowedUsd - Borrowed amount in USD
 * @param liquidationRatio - Liquidation threshold (e.g., 85 for 85%)
 * @returns Health factor (Infinity if no loan)
 */
export function calculateHealthFactor(
  collateralUsd: number,
  borrowedUsd: number,
  liquidationRatio: number
): number {
  if (borrowedUsd <= 0) return Infinity;
  if (collateralUsd <= 0) return 0;
  const ltv = calculateLtv(borrowedUsd, collateralUsd);
  if (ltv <= 0) return Infinity;
  return liquidationRatio / ltv;
}

/**
 * Get health status based on health factor
 * @param healthFactor - Calculated health factor
 * @returns "safe" | "warning" | "danger"
 */
export function getHealthStatus(healthFactor: number): HealthStatus {
  if (healthFactor >= 1.5) return "safe";
  if (healthFactor >= 1.2) return "warning";
  return "danger";
}

/**
 * Calculate maximum borrow capacity based on collateral
 * @param collateralUsd - Collateral value in USD
 * @param maxLtv - Maximum LTV ratio (e.g., 80 for 80%)
 * @returns Maximum borrowable amount in USD
 */
export function calculateBorrowCapacity(
  collateralUsd: number,
  maxLtv: number
): number {
  if (collateralUsd < 0 || maxLtv < 0) return 0;
  return collateralUsd * (maxLtv / 100);
}

/**
 * Calculate available amount to borrow (capacity minus already borrowed)
 * @param collateralUsd - Collateral value in USD
 * @param borrowedUsd - Currently borrowed amount in USD
 * @param maxLtv - Maximum LTV ratio (e.g., 80 for 80%)
 * @returns Available to borrow in USD (never negative)
 */
export function calculateAvailableToBorrow(
  collateralUsd: number,
  borrowedUsd: number,
  maxLtv: number
): number {
  const capacity = calculateBorrowCapacity(collateralUsd, maxLtv);
  return Math.max(0, capacity - borrowedUsd);
}

/**
 * Run a full loan simulation with all calculations
 * @param params - Simulation parameters
 * @returns Complete simulation result
 */
export function simulateLoan(params: SimulationParams): SimulationResult {
  const {
    collateralWbtc,
    borrowedUsd,
    btcPrice,
    maxLtv,
    liquidationRatio,
    borrowApr,
  } = params;

  const collateralUsd = calculateCollateralValueUsd(collateralWbtc, btcPrice);
  const ltv = calculateLtv(borrowedUsd, collateralUsd);
  const borrowCapacity = calculateBorrowCapacity(collateralUsd, maxLtv);
  const borrowableAmount = calculateAvailableToBorrow(collateralUsd, borrowedUsd, maxLtv);
  const liquidationPrice = calculateLiquidationPrice(borrowedUsd, collateralWbtc, liquidationRatio);
  const healthFactor = calculateHealthFactor(collateralUsd, borrowedUsd, liquidationRatio);
  const healthStatus = getHealthStatus(healthFactor);

  // Market interest calculations (based on market APR only)
  const yearlyMarketInterest = calculateTotalInterest(borrowedUsd, borrowApr);
  const monthlyMarketInterest = calculateMonthlyPayment(borrowedUsd, borrowApr);

  // Stack'd fee calculations
  const yearlyStackdFee = calculateYearlyStackdFee(borrowedUsd);
  const monthlyStackdFee = calculateMonthlyStackdFee(borrowedUsd);

  // Total interest (market + Stack'd)
  const totalApr = borrowApr + STACKD_ADDITIONAL_APR;
  const yearlyInterest = yearlyMarketInterest + yearlyStackdFee;
  const monthlyInterest = monthlyMarketInterest + monthlyStackdFee;

  return {
    ltv,
    borrowableAmount,
    borrowCapacity,
    liquidationPrice,
    healthFactor,
    healthStatus,
    monthlyInterest,
    yearlyInterest,
    availableToBorrow: borrowableAmount,
    // Stack'd fee breakdown
    marketApr: borrowApr,
    stackdFeeApr: STACKD_ADDITIONAL_APR,
    totalApr,
    monthlyStackdFee,
    yearlyStackdFee,
    monthlyMarketInterest,
    yearlyMarketInterest,
  };
}


/**
 * Simulate the effect of a BTC price drop on a loan
 * @param currentPrice - Current BTC price
 * @param dropPercent - Percentage drop (e.g., 20 for 20% drop)
 * @param loan - Current loan state
 * @returns Simulation result after price drop
 */
export function simulatePriceDrop(
  currentPrice: number,
  dropPercent: number,
  loan: LoanState
): SimulationResult {
  const newPrice = currentPrice * (1 - dropPercent / 100);

  return simulateLoan({
    collateralWbtc: loan.collateralWbtc,
    borrowedUsd: loan.borrowedUsd,
    btcPrice: newPrice,
    maxLtv: loan.maxLtv,
    liquidationRatio: loan.liquidationRatio,
    borrowApr: loan.borrowApr,
  });
}

/**
 * Simulate adding additional collateral to a loan
 * @param additionalWbtc - Additional WBTC to add
 * @param loan - Current loan state
 * @returns Simulation result after adding collateral
 */
export function simulateAddCollateral(
  additionalWbtc: number,
  loan: LoanState
): SimulationResult {
  const newCollateral = loan.collateralWbtc + additionalWbtc;

  return simulateLoan({
    collateralWbtc: newCollateral,
    borrowedUsd: loan.borrowedUsd,
    btcPrice: loan.btcPrice,
    maxLtv: loan.maxLtv,
    liquidationRatio: loan.liquidationRatio,
    borrowApr: loan.borrowApr,
  });
}

/**
 * Simulate repaying part of the loan
 * @param repayAmount - Amount to repay in USD
 * @param loan - Current loan state
 * @returns Simulation result after repayment
 */
export function simulateRepayment(
  repayAmount: number,
  loan: LoanState
): SimulationResult {
  const newBorrowed = Math.max(0, loan.borrowedUsd - repayAmount);

  return simulateLoan({
    collateralWbtc: loan.collateralWbtc,
    borrowedUsd: newBorrowed,
    btcPrice: loan.btcPrice,
    maxLtv: loan.maxLtv,
    liquidationRatio: loan.liquidationRatio,
    borrowApr: loan.borrowApr,
  });
}
