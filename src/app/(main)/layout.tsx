import ResponsiveNav from "@/components/ui/ResponsiveNav";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
      <ResponsiveNav />
    </div>
  );
};

export default MainLayout;
