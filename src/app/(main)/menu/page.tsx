"use client";

import MenuItem from "@/components/common/MenuItem";
import {
  CircleDollarSignIcon,
  MessageSquareIcon,
  UserIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from "lucide-react";

const Menu = () => {
  const handleContactUs = () => {
    (window as any).OpenWidget?.call("maximize");
  };

  const handleOpenExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
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
        <li>
          <MenuItem
            href="#"
            leading={
              <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center">
                <FileTextIcon className="h-5 w-5 text-amber-500" />
              </div>
            }
            label="Terms of Service"
            onClick={() => handleOpenExternal("https://www.stackdapp.co/terms")}
          />
        </li>
        <li>
          <MenuItem
            href="#"
            leading={
              <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center">
                <ShieldCheckIcon className="h-5 w-5 text-amber-500" />
              </div>
            }
            label="Privacy Policy"
            onClick={() => handleOpenExternal("https://www.stackdapp.co/privacy")}
          />
        </li>
      </ul>
    </div>
  );
};

export default Menu;

