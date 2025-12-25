"use client";

import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

const MenuItem = ({
  href,
  leading,
  trailing,
  label,
  disabled = false,
  customContent,
  onClick,
}: {
  href: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  label?: string;
  disabled?: boolean;
  customContent?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "rounded-2xl border border-white/10 flex gap-3 items-center py-4 px-4 hover:bg-white/5 transition-colors",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {leading && leading}
      {customContent && !label && customContent}
      {!customContent && label && <span className="flex flex-1 text-white font-medium">{label}</span>}
      {trailing ? trailing : <ArrowRightIcon className="h-5 w-5 text-white/40" />}
    </Link>
  );
};

export default MenuItem;
