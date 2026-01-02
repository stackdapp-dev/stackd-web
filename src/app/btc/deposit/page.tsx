'use client';

import { DepositFlow } from '@/components/btc';
import { usePrivy } from '@privy-io/react-auth';

export default function BtcDepositPage() {
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address;

  return (
    <div className="min-h-screen bg-black p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <DepositFlow evmAddress={walletAddress} />
      </div>
    </div>
  );
}
