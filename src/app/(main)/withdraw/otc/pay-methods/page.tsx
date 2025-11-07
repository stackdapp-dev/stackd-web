"use client";

import MenuItem from "@/components/common/MenuItem";
import PageHeader from "@/components/common/PageHeader";
import BottomSheet from "@/components/ui/bottomSheet";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { deleteUserPaymentMethod, UserPaymentMethod } from "@/lib/api/user";
import { useUser } from "@/providers/UserProvider";
import { useWithdrawOTC } from "@/providers/WithrawOTCProvider";
import { AlertTriangleIcon, EllipsisVerticalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PayMethods = () => {
  const { paymentMethods, getAccessToken, refetchPaymentMethods } = useUser();
  const { setPaymentMethod } = useWithdrawOTC();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<UserPaymentMethod | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const handleDelete = async () => {
    if (!selectedMethod) return;
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token available");
      await deleteUserPaymentMethod(token, selectedMethod.id);
      await refetchPaymentMethods();
    } catch (error) {
      console.error("Failed to delete payment method:", error);
    } finally {
      setIsModalOpen(false);
      setSelectedMethod(null);
    }
  };

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
              trailing={
                <button
                  aria-label="More options"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedMethod(paymentMethod);
                    // open bottom sheet with actions
                    setIsBottomSheetOpen(true);
                  }}
                  className="p-1"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>
              }
            />
          </li>
        ))}
      </ul>
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onDelete={() => {
          setIsBottomSheetOpen(false);
          setIsModalOpen(true);
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Are you sure you want to delete this?"
        message={""}
        icon={<AlertTriangleIcon size={36} className="text-amber-500" />}
        primaryButtonText="Confirm"
        primaryButtonAction={handleDelete}
        secondaryButtonText="Go back"
        secondaryButtonAction={() => setIsModalOpen(false)}
      />
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
