"use client";

import Card from "@/components/ui/card";
import { formatPercent, maskString, MASK_SHORT } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { useRouter } from "next/navigation";
import { useMultiLoan } from "@/providers/MultiLoanProvider";

// Helper to get display name for loan
function getLoanDisplayName(collateralToken: string, borrowToken: string): string {
  if (collateralToken === "WBTC") return "BTC:USDT";
  if (collateralToken === "XAUT") return "XAU:USD";
  return `${collateralToken}:${borrowToken}`;
}

// Helper to get network name
function getNetworkName(chain: string): string {
  if (chain === "arbitrum") return "Arbitrum";
  if (chain === "ethereum") return "Ethereum";
  return chain;
}

export default function ActiveLoans() {
  const router = useRouter();
  const visibility = useVisibility();
  const { allPositions, hasActiveLoans, isLoading } = useMultiLoan();

  return (
    <div className="px-4">
      {/* Section Header */}
      <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
        Active Loans
      </h2>

      {isLoading ? (
        // Loading skeleton while fetching loan data
        <Card appearance="glassDark" data-testid="active-loans-loading-skeleton">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-2">
              <div className="h-5 w-28 bg-white/10 rounded skeleton-shimmer" />
              <div className="h-4 w-40 bg-white/10 rounded skeleton-shimmer" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-5 w-20 bg-white/10 rounded skeleton-shimmer" />
              <div className="h-4 w-24 bg-white/10 rounded skeleton-shimmer" />
            </div>
          </div>

          {/* LTV Progress Bar Skeleton */}
          <div className="mt-2">
            <div className="h-2 bg-white/10 rounded-full skeleton-shimmer" />
            <div className="h-4 w-16 bg-white/10 rounded skeleton-shimmer mt-1" />
          </div>
        </Card>
      ) : hasActiveLoans ? (
        <div className="space-y-3">
          {allPositions.map((position) => {
            const ltvPercent = Math.min(position.ltv, position.maxLtv);
            const ltvBarWidth = position.maxLtv > 0 ? (ltvPercent / position.maxLtv) * 100 : 0;

            return (
              <Card
                key={position.id}
                appearance="glassDark"
                className="cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => router.push(`/wallet/loan/${position.collateralToken.toLowerCase()}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-semibold">
                      {getLoanDisplayName(position.collateralToken, position.borrowToken)}
                    </h3>
                    <p className="text-white/50 text-sm">
                      Using {position.collateralToken} as collateral
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{getNetworkName(position.chain)}</p>
                    <p className="text-white/50 text-sm">
                      {maskString(formatPercent(position.apr), visibility.visible, MASK_SHORT)} APR
                    </p>
                  </div>
                </div>

                {/* LTV Progress Bar */}
                <div className="mt-2">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${ltvBarWidth}%` }}
                    />
                  </div>
                  <p className="text-white/60 text-sm mt-1">
                    {maskString(formatPercent(position.ltv), visibility.visible, MASK_SHORT)} LTV
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        // No Open Loans frame
        <Card appearance="glassDark" className="py-8">
          <p className="text-white/50 text-center text-sm">No Open Loans</p>
        </Card>
      )}

    </div>
  );
}
