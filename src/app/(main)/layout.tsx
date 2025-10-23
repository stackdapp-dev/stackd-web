import BottomNav from "@/components/ui/bottomNav";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
