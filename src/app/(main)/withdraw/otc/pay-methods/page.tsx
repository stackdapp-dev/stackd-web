"use client";

import MenuItem from "@/components/common/MenuItem";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useUser } from "@/providers/UserProvider";
import { useWithdrawOTC } from "@/providers/WithrawOTCProvider";
import { EllipsisVerticalIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const PayMethods = () => {
  const { paymentMethods } = useUser();
  const { setPaymentMethod } = useWithdrawOTC();
  const router = useRouter();

  return (
    <div className="p-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Favorites" />
      <ul className="flex flex-col gap-4">
        {paymentMethods.map((paymentMethod) => (
          <li key={paymentMethod.id}>
            <MenuItem
              href="#"
              onClick={() => {
                setPaymentMethod(paymentMethod);
                console.log("selected payment method:", paymentMethod);
                router.push("/withdraw/otc/review");
              }}
              customContent={
                <div className="flex flex-col gap-0.5 flex-1 text-sm">
                  <div className="font-semibold">
                    {paymentMethod.alias ?? "--"}
                  </div>
                  <div className="text-xs">
                    {paymentMethod.bankName} ・{" "}
                    {paymentMethod.type === "bank"
                      ? paymentMethod.bankAccountNumber
                      : paymentMethod.phoneNumber}
                  </div>
                </div>
              }
              trailing={<EllipsisVerticalIcon className="h-4 w-4" />}
            />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button
          className="w-full"
          onClick={() => router.push("/withdraw/otc/pay-methods/add")}
        >
          Add a Payment Method
        </Button>
      </div>
    </div>
  );
};

export default PayMethods;
