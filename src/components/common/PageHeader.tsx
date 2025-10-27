"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

const PageHeader = ({
  title,
  backHref,
}: {
  title: string;
  backHref: string;
}) => {
  return (
    <div>
      <Link className="absolute" href={backHref}>
        <ArrowLeftIcon className="h-7 w-7" />
      </Link>
      <h1 className="text-center text-2xl font-bold">{title}</h1>
    </div>
  );
};

export default PageHeader;
