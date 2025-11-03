"use client";

import MenuItem from "@/components/common/MenuItem";
import {
  CircleDollarSignIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";

const Menu = () => {
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
            href="/profile"
            leading={<UserIcon className="h-4 w-4 text-primary" />}
            label="Profile"
          />
        </li>
      </ul>
    </div>
  );
};

export default Menu;
