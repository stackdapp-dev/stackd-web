'use client';

import { WithdrawalFlow } from '@/components/btc';

export default function BtcWithdrawPage() {
  return (
    <div className="min-h-screen bg-black p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <WithdrawalFlow />
      </div>
    </div>
  );
}
