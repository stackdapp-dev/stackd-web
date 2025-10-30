"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { Balance } from "@/components/wallet";
import Assets from "@/components/wallet/Assets";
import LoanInfo from "@/components/wallet/LoanInfo";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useEffect } from "react";

const Wallet = () => {
  const { assets, totalBalance, refetchBalances } = useWalletBalanceContext();
  const { loanCalcs, refetchLoanData } = useLoanCalculationsContext();
  const { netLoanValue } = loanCalcs;

  useEffect(() => {
    const refreshData = async () => {
      await Promise.all([refetchBalances(), refetchLoanData()]);
    };
    refreshData();
  }, [refetchBalances, refetchLoanData]);

  return (
    <div className="flex flex-col gap-8 items-center p-6 pt-8">
      <>
        <Balance amount={totalBalance + netLoanValue} />
        <Assets items={assets} />
        <LoanInfo />
      </>
    </div>
  );
};

export default Wallet;
