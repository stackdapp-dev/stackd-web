"use client";

import PageHeader from "@/components/common/PageHeader";
import WalletAddressWithCopyButton from "@/components/common/WalletAddressWithCopyButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { AlertCircleIcon } from "lucide-react";
import { use } from "react";

const Wallet = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { exportWallet } = usePrivy();

  return (
    <div className="px-4 md:px-6 py-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Backup Private Key" />
      <div className="flex flex-col gap-8">
        <WalletAddressWithCopyButton walletAddress={id} />

        <Alert variant="destructive">
          <AlertCircleIcon className="h-5 w-5" />
          <AlertDescription>
            <p>
              Your private key gives full access to your wallet and funds. Store
              it securely and never share it with anyone.
            </p>
          </AlertDescription>
        </Alert>

        <Button onClick={() => exportWallet({ address: id })}>
          Export Private Key
        </Button>
      </div>
    </div>
  );
};

export default Wallet;
