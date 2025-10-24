"use client";

import { Loading } from "@/components/ui/loading";
import { Balance } from "@/components/wallet";
import Assets from "@/components/wallet/Assets";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useTokenPrices } from "@/providers/TokenPriceProvider";

const Wallet = () => {
  const { tokenPrices } = useTokenPrices();
  const { assets, totalBalance, isLoading } = useWalletBalance(tokenPrices);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 items-center p-6 pt-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 items-center p-6 pt-12">
      <>
        <Balance amount={totalBalance} />
        <Assets items={assets} />
      </>
    </div>
  );
};

export default Wallet;
