import ResponsiveNav from "@/components/ui/ResponsiveNav";
import EarlyAccessModal from "@/components/ui/EarlyAccessModal";
import AppVersion from "@/components/common/AppVersion";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <EarlyAccessModal />
      {children}
      <AppVersion />
      <ResponsiveNav />
    </div>
  );
};

export default MainLayout;
