"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { Balance } from "@/components/wallet";
import Assets from "@/components/wallet/Assets";
import LoanInfo from "@/components/wallet/LoanInfo";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";

const Wallet = () => {
  const { assets, totalBalance } = useWalletBalanceContext();
  const { loanCalcs } = useLoanCalculationsContext();
  const { netLoanValue } = loanCalcs;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Hero Balance */}
      <Balance amount={totalBalance + netLoanValue} />

      {/* Assets List */}
      <Assets items={assets} />

      {/* Loan Info */}
      <div className="px-4">
        <LoanInfo />
      </div>
    </div>
  );
};

export default Wallet;
