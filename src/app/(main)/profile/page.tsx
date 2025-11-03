"use client";

import MenuItem from "@/components/common/MenuItem";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import { useWeb3 } from "@/providers/Web3Provider";
import { usePrivy } from "@privy-io/react-auth";
import { LogOutIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";

const Profile = () => {
  const { wallets, activeWalletIndex, setActiveWalletIndex } = useWeb3();
  const { logout } = usePrivy();

  const [isLoading, setIsLoading] = useState(false);

  const signout = async () => {
    setIsLoading(true);
    logout();
    await new Promise((resolve) => setTimeout(resolve, 500));
    redirect("/");
  };

  return (
    <div className="p-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Profile" />

      <div className="flex flex-col gap-4">
        <h2 className="text-xl text-primary">My Wallets</h2>
        <ul className="flex flex-col gap-4">
          {wallets.map((wallet, i) => (
            <li key={wallet.address}>
              <MenuItem
                href="#"
                customContent={
                  <div className="flex flex-col gap-0.5 flex-1 text-sm">
                    <div className="break-all font-semibold">
                      {wallet.address}
                    </div>
                    <div className="text-xs">{wallet.meta.name}</div>
                  </div>
                }
                trailing={
                  <Switch
                    checked={i === activeWalletIndex}
                    onCheckedChange={() => setActiveWalletIndex(i)}
                  />
                }
              />
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant="link"
        className="text-destructive mx-auto"
        onClick={() => signout()}
        disabled={isLoading}
      >
        {isLoading ? <Loading /> : <LogOutIcon />} Sign out
      </Button>
    </div>
  );
};

export default Profile;
