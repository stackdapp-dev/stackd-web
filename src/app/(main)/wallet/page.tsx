"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { Balance } from "@/components/wallet";
import ActionButtons from "@/components/wallet/ActionButtons";
import ActiveLoans from "@/components/wallet/ActiveLoans";
import Assets from "@/components/wallet/Assets";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useVisibility } from "@/providers/visibility";

const Wallet = () => {
  const { assets, totalBalance } = useWalletBalanceContext();
  const { loanCalcs } = useLoanCalculationsContext();
  const { netLoanValue } = loanCalcs;
  const visibility = useVisibility();

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Hero Balance */}
      <Balance
        amount={totalBalance + netLoanValue}
        visible={visibility.visible}
        onToggleVisibility={visibility.toggle}
      />

      {/* Action Buttons */}
      <ActionButtons />

      {/* Assets List */}
      <Assets items={assets} />

      {/* Active Loans */}
      <ActiveLoans />
    </div>
  );
};

export default Wallet;
