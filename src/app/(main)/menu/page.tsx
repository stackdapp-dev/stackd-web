"use client";

import MenuItem from "@/components/common/MenuItem";
import {
  CircleDollarSignIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";

const Menu = () => {
  const handleContactUs = () => {
    (window as any).OpenWidget?.call("maximize");
  };

  return (
    <div className="p-6 flex flex-col gap-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      {/* Header */}
      <h1 className="text-white text-xl font-semibold text-center">Menu</h1>

      {/* Menu Items */}
      <ul className="flex flex-col gap-4">
        <li>
          <MenuItem
            href="/withdraw"
            leading={
              <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center">
                <CircleDollarSignIcon className="h-5 w-5 text-amber-500" />
              </div>
            }
            label="Withdraw"
          />
        </li>
        <li>
          <MenuItem
            href="#"
            leading={
              <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center">
                <MessageSquareIcon className="h-5 w-5 text-amber-500" />
              </div>
            }
            label="Contact Us"
            onClick={handleContactUs}
          />
        </li>
        <li>
          <MenuItem
            href="/profile"
            leading={
              <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-amber-500" />
              </div>
            }
            label="Profile"
          />
        </li>
      </ul>
    </div>
  );
};

export default Menu;
