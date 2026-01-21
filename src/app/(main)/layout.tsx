import ResponsiveNav from "@/components/ui/ResponsiveNav";
import EarlyAccessModal from "@/components/ui/EarlyAccessModal";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <EarlyAccessModal />
      {children}
      <ResponsiveNav />
    </div>
  );
};

export default MainLayout;
