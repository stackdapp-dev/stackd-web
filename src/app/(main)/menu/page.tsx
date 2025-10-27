"use client";

import MenuItem from "@/components/common/MenuItem";
import { Button } from "@/components/ui/button";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  CircleDollarSignIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";
import { redirect } from "next/navigation";

const Menu = () => {
  const { logout } = usePrivy();
  const { wallets } = useWallets();

  return (
    <div className="p-6 flex flex-col gap-8">
      <h1 className="text-center text-2xl font-bold">Menu</h1>

      <ul className="flex flex-col gap-4">
        <li>
          <MenuItem
            href="/withdraw"
            leading={<CircleDollarSignIcon className="h-4 w-4 text-primary" />}
            label="Withdraw"
          />
        </li>
        <li>
          <MenuItem
            href="#"
            leading={<MessageSquareIcon className="h-4 w-4 text-primary" />}
            label="Contact Us"
          />
        </li>
        <li>
          <MenuItem
            href="#"
            leading={<UserIcon className="h-4 w-4 text-primary" />}
            label="Profile"
          />
        </li>
      </ul>

      <div>
        <div className="wrap-anywhere">
          Wallet: {wallets.length ? wallets[0].address : "Loading..."}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            logout();
            redirect("/");
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Menu;
