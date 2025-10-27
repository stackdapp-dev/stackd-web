"use client";

import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

const MenuItem = ({
  href,
  leading,
  label,
  disabled = false,
}: {
  href: string;
  leading: React.ReactNode;
  label: string;
  disabled?: boolean;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "border-1 rounded border-neutral-500 flex gap-2 items-center py-3 px-4 hover:bg-foreground/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {leading}
      <span className="flex flex-1">{label}</span>
      <ArrowRightIcon className="h-4 w-4" />
    </Link>
  );
};

export default MenuItem;
