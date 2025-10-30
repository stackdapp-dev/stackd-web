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
        "border-1 rounded border-neutral-500 flex gap-2 items-center py-3 px-4 hover:bg-foreground/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {leading && leading}
      {customContent && !label && customContent}
      {!customContent && label && <span className="flex flex-1">{label}</span>}
      {trailing ? trailing : <ArrowRightIcon className="h-4 w-4" />}
    </Link>
  );
};

export default MenuItem;
