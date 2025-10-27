"use client";

import MenuItem from "@/components/common/MenuItem";
import PageHeader from "@/components/common/PageHeader";
import { HandCoinsIcon } from "lucide-react";
import Image from "next/image";

const Withdraw = () => {
  return (
    <div className="p-6 flex flex-col gap-8">
      <PageHeader title="Withdraw USDT" backHref="/menu" />

      <ul className="flex flex-col gap-4">
        <li>
          <MenuItem
            href="/withdraw/otc"
            leading={<HandCoinsIcon className="h-4 w-4 text-primary" />}
            label="Withdraw via OTC"
          />
        </li>
        <li>
          <MenuItem
            href="#"
            leading={
              <Image
                src="/assets/brands/binance.png"
                alt="Binance"
                width={24}
                height={24}
              />
            }
            label="Withdraw via Binance"
            disabled
          />
        </li>
        <li>
          <MenuItem
            href="#"
            leading={
              <Image
                src="/assets/brands/coinbase.png"
                alt="Coinbase"
                width={24}
                height={24}
              />
            }
            label="Withdraw via Coinbase"
            disabled
          />
        </li>
      </ul>
    </div>
  );
};

export default Withdraw;
