import WithdrawOTCProvider from "@/providers/WithrawOTCProvider";
import React from "react";

const WithdrawOTCLayout = ({ children }: { children: React.ReactNode }) => {
  return <WithdrawOTCProvider>{children}</WithdrawOTCProvider>;
};

export default WithdrawOTCLayout;
