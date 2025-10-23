"use client";

import { Button } from "@/components/ui/button";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  ArrowRightIcon,
  CircleDollarSignIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const Menu = () => {
  const { logout } = usePrivy();
  const { wallets } = useWallets();

  return (
    <div className="p-6 flex flex-col gap-8">
      <h1 className="text-center text-2xl font-bold">Menu</h1>
      <ul className="flex flex-col gap-4">
        <li>
          <Link
            href="#"
            className="border-1 rounded border-neutral-500 flex gap-2 items-center py-2 px-4 hover:bg-foreground/10"
          >
            <CircleDollarSignIcon className="h-4 w-4 text-primary" />
            <span className="flex flex-1">Withdraw</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="border-1 rounded border-neutral-500 flex gap-2 items-center py-2 px-4 hover:bg-foreground/10"
          >
            <MessageSquareIcon className="h-4 w-4 text-primary" />
            <span className="flex flex-1">Contact Us</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </li>
        <li>
          <Link
            href="#"
            className="border-1 rounded border-neutral-500 flex gap-2 items-center py-2 px-4 hover:bg-foreground/10"
          >
            <UserIcon className="h-4 w-4 text-primary" />
            <span className="flex flex-1">Profile</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
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
