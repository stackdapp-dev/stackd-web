"use client";

import { Balance } from "@/components/wallet";
import Assets from "@/components/wallet/Assets";
import LoanInfo from "@/components/wallet/LoanInfo";
import { useCompound } from "@/hooks/useCompound";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useTokenPrices } from "@/providers/TokenPriceProvider";

const Wallet = () => {
  const { tokenPrices } = useTokenPrices();
  const { assets, totalBalance } = useWalletBalance(tokenPrices);
  const { suppliedAssets, borrowedAssets, netLoanValue } = useCompound();
  const walletBalance = totalBalance + netLoanValue;

  return (
    <div className="flex flex-col gap-8 items-center p-6 pt-8">
      <>
        <Balance amount={walletBalance} />
        <Assets items={assets} />
        <LoanInfo assets={assets} supplied={suppliedAssets} borrowed={borrowedAssets} />
      </>
    </div>
  );
};

export default Wallet;
