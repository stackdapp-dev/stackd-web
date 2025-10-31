"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { Balance } from "@/components/wallet";
import Assets from "@/components/wallet/Assets";
import LoanInfo from "@/components/wallet/LoanInfo";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useEffect } from "react";

const Wallet = () => {
  const { assets, totalBalance } = useWalletBalanceContext();
  const { loanCalcs } = useLoanCalculationsContext();
  const { netLoanValue } = loanCalcs;

  useEffect(() => {
    // console.log("Wallet page values:", { totalBalance, netLoanValue, total: totalBalance + netLoanValue });
  }, [totalBalance, netLoanValue]);


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
