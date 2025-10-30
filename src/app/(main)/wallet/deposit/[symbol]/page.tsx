"use client";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import { useWeb3 } from "@/providers/Web3Provider";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { arbitrum } from "viem/chains";

export default function DepositPage({ params }: { params: Promise<{ symbol?: string }> }) {
  const router = useRouter();
  const { walletClient } = useWeb3();

  const symbol = React.use(params).symbol || "ETH";
  const address = walletClient?.account?.address || "-";

  const qrNode = React.useMemo(
    () => <QRCodeSVG value={address} size={220} marginSize={1} fgColor="#000000" bgColor="#ffffff" />,
    [address]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address || "");
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title={`Deposit ${symbol}`}/>

      <div className="flex justify-center">
        {qrNode}
      </div>

      <div className="text-left">
        <Text tone="white">
          Network
        </Text>
        <Text className="mb-3">
          {arbitrum.name}
        </Text>
      </div>

      <div>
        <Text tone="white">
          Wallet Address
        </Text>
        <div className="relative">
          <div className="flex items-center">
            <Text className="flex-1 leading-tight break-all">
              {address || "-"}
            </Text>
            <button onClick={handleCopy} className="ml-2 p-2 rounded bg-white/5 hover:bg-white/10">
              <Copy size={18} />
            </button>
          </div>
        </div>
      </div>

      <Button onClick={() => router.back()} className="w-full">
        Done
      </Button>
    </div>
  );
}
