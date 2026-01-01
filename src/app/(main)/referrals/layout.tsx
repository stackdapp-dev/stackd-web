"use client";

import { LoanCalculationsProvider } from "@/providers/LoanCalculationsProvider";

export default function ReferralsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoanCalculationsProvider>
      {children}
    </LoanCalculationsProvider>
  );
}
