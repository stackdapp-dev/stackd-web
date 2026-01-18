"use client";

import PageHeader from "@/components/common/PageHeader";
import WalletAddressWithCopyButton from "@/components/common/WalletAddressWithCopyButton";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { useWeb3 } from "@/providers/Web3Provider";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { arbitrum } from "viem/chains";

export default function DepositPage({
  params,
}: {
  params: Promise<{ symbol?: string }>;
}) {
  const router = useRouter();
  const { walletClient, activeWalletAddress } = useWeb3();

  const symbol = React.use(params).symbol || "ETH";
  const address = walletClient?.account?.address || activeWalletAddress;

  const qrNode = React.useMemo(
    () => (
      <QRCodeSVG
        value={address}
        size={220}
        marginSize={1}
        fgColor="#000000"
        bgColor="#ffffff"
      />
    ),
    [address]
  );

  return (
    <div className="w-full max-w-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title={`Deposit ${symbol}`} />

      <div className="flex justify-center">{qrNode}</div>

      <div className="flex flex-col gap-2">
        <div className="text-white/40 text-sm">Network</div>
        <Card appearance="glassDark" padding="default">
          <span className="text-white">{arbitrum.name}</span>
        </Card>
      </div>

      <WalletAddressWithCopyButton walletAddress={address || ""} />

      <Button onClick={() => router.back()} className="w-full">
        Done
      </Button>
    </div>
  );
}
