"use client";

import MenuItem from "@/components/common/MenuItem";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import { getPrivyUserIdentifier, shortenAddress } from "@/lib/utils";
import { useWeb3 } from "@/providers/Web3Provider";
import { useLogout, usePrivy } from "@privy-io/react-auth";
import { KeyIcon, LogOutIcon } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";

const Profile = () => {
  const { wallets, activeWalletAddress, setActiveWalletAddress } = useWeb3();
  const { user } = usePrivy();
  const router = useRouter();

  const { logout } = useLogout({
    onSuccess: () => {
      redirect("/");
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const signout = async () => {
    setIsLoading(true);
    logout();
  };

  return (
    <div className="p-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Profile" />

      <div className="flex flex-col gap-4">
        <h2 className="text-xl text-primary">Select Wallet</h2>
        <ul className="flex flex-col gap-4">
          {wallets.map((wallet) => (
            <li key={wallet.address}>
              <MenuItem
                href="#"
                customContent={
                  <div className="flex flex-col gap-1 flex-1 text-sm">
                    <div className="break-all font-semibold text-md">
                      {shortenAddress(wallet.address)}
                    </div>
                    {wallet.walletClientType === "privy" && (
                      <Button
                        size="xs"
                        className="w-fit"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/wallet/${wallet.address}`);
                        }}
                      >
                        <KeyIcon className="h-2 w-2" />
                        Backup
                      </Button>
                    )}
                  </div>
                }
                trailing={
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-neutral-400">
                      {wallet.meta.name}
                    </div>
                    <Switch
                      checked={wallet.address === activeWalletAddress}
                      onCheckedChange={() =>
                        setActiveWalletAddress(wallet.address as `0x${string}`)
                      }
                    />
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-center">
          Signed in as: {getPrivyUserIdentifier(user)}
        </div>

        <Button
          variant="outline"
          className="text-destructive mx-auto"
          onClick={() => signout()}
          disabled={isLoading}
        >
          {isLoading ? <Loading /> : <LogOutIcon />} Sign out
        </Button>
      </div>
    </div>
  );
};

export default Profile;
