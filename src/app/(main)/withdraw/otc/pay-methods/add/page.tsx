"use client";

import PageHeader from "@/components/common/PageHeader";
import AddEWallet from "@/components/modules/withdraw/AddEWallet";
import AddPaymentMethod from "@/components/modules/withdraw/AddPaymentMethod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AddPayMethod = () => {
  return (
    <div className="px-4 md:px-6 py-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Add a Payment Method" />

      <Tabs defaultValue="bank">
        <TabsList className="w-full justify-evenly mb-4">
          <TabsTrigger value="bank" className="w-full">
            Bank Transfer
          </TabsTrigger>
          <TabsTrigger value="ewallet" className="w-full">
            E-wallet
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bank">
          <AddPaymentMethod />
        </TabsContent>
        <TabsContent value="ewallet">
          <AddEWallet />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddPayMethod;
