import { TransactionsProvider } from "@/providers/TransactionsProvider";
import React from "react";

const HistoryLayout = ({ children }: { children: React.ReactNode }) => {
  return <TransactionsProvider>{children}</TransactionsProvider>;
};

export default HistoryLayout;
