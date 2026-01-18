"use client";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/ui/loading";
import Modal from "@/components/ui/modal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOKEN_ADDRESSES } from "@/constants/addresses";
import { TOKEN_METADATA } from "@/constants/Tokens";
// import useTokenApproval from "@/hooks/useTokenApproval";
import useTokenTransfer from "@/hooks/useTokenTransfer";
import { createOrder } from "@/lib/api/orders";
import { formatAmount } from "@/lib/utils";
import { useUser } from "@/providers/UserProvider";
import {
  MIN_PHP_AMOUNT_NO_FEE,
  PHP_WITHDRAW_FEE,
  useWithdrawOTC,
} from "@/providers/WithrawOTCProvider";
import { Label } from "@radix-ui/react-label";
import { AlertTriangleIcon, Edit3Icon, InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseUnits } from "viem";

const ReviewOrder = () => {
  const {
    amount,
    convertedAmount,
    exchangeRate,
    paymentMethod,
    transferTxHash,
    setTransferTxHash,
  } = useWithdrawOTC();
  const router = useRouter();
  const { getAccessToken } = useUser();
  // const { approveIfNecessary } = useTokenApproval();
  const { transferToCashoutMultisig } = useTokenTransfer();

  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const placeOrder = async () => {
    setIsLoading(true);

    // step 1: transfer crypto to cashout multisig
    const txHash = await transferCrypto();

    if (txHash) {
      // step 2: create order in the backend
      const createOrderSuccess = await sendOrder(txHash);

      if (createOrderSuccess) {
        // step 3: redirect to transaction history tab
        router.push("/history");
      }
    }
  };

  const transferCrypto = async () => {
    if (transferTxHash) {
      return transferTxHash;
    }

    const cryptoAmount = parseUnits(amount, TOKEN_METADATA["USDT"].decimals);

    const { txHash, error: transferError } = await transferToCashoutMultisig(
      TOKEN_ADDRESSES.USDT,
      cryptoAmount
    );

    if (transferError) {
      setIsLoading(false);
      setErrorMessage(transferError);
      return false;
    }

    console.log("Transfer tx hash:", txHash);
    if (txHash) {
      // Save transfer tx hash to context
      // This is to prevent duplicate transfers in the event that order creation failed
      setTransferTxHash(txHash);
    }

    return txHash;
  };

  const sendOrder = async (transferTxHash: string) => {
    const accessToken = await getAccessToken();

    let paymentMethodId: string | undefined = undefined;
    let paymentMethodMetadata: string | undefined = undefined;

    // Check if paymentMethod has an 'id' property (UserPaymentMethod)
    if (paymentMethod && "id" in paymentMethod) {
      paymentMethodId = paymentMethod.id;
    } else {
      paymentMethodMetadata = JSON.stringify(paymentMethod);
    }

    try {
      await createOrder(accessToken!, {
        cryptoAmount: amount,
        fiatAmount: convertedAmount,
        transferTxHash: transferTxHash,
        paymentMethodId,
        paymentMethodMetadata,
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      return false;
    }
  };

  return (
    <div className="px-4 md:px-6 py-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Review Order" />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl text-primary">Transaction Summary</h2>
            <button onClick={() => router.push("/withdraw/otc")}>
              <Edit3Icon size={20} />
            </button>
          </div>
          <div className="border p-4 rounded-xl border-neutral-500">
            <div className="flex justify-between items-center">
              <span>Withdraw Amount</span>
              <span>{amount} USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Exchange Rate</span>
              <span>
                ~{formatAmount(Number(exchangeRate?.data))} PHP / USDT
              </span>
            </div>
            {Number(convertedAmount) > MIN_PHP_AMOUNT_NO_FEE ? (
              <div className="flex justify-between items-center">
                <span>Amount to Receive</span>
                <span>{formatAmount(Number(convertedAmount))} PHP</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span>{formatAmount(Number(convertedAmount))} PHP</span>
                </div>
                <div className="flex justify-between items-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="flex items-center gap-1">
                        Flat Fee <InfoIcon size={16} />{" "}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        A {formatAmount(PHP_WITHDRAW_FEE)} PHP flat fee applies
                        to withdrawals below{" "}
                        {formatAmount(MIN_PHP_AMOUNT_NO_FEE)} PHP
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <span>{formatAmount(PHP_WITHDRAW_FEE)} PHP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Amount to Receive</span>
                  <span>
                    {formatAmount(Number(convertedAmount) - PHP_WITHDRAW_FEE)}{" "}
                    PHP
                  </span>
                </div>
              </>
            )}
          </div>
          <span className="text-xs">
            <b>Note:</b> Actual settlement rate may vary based on market
            conditions at the time of disbursement.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl text-primary">Recipient Details</h2>
            <button onClick={() => router.push("/withdraw/otc/pay-methods")}>
              <Edit3Icon size={20} />
            </button>
          </div>
          <div className="border p-4 rounded-xl border-neutral-500">
            <div className="flex justify-between items-center">
              <span>
                {paymentMethod?.type === "bank" ? "Bank Name" : "E-wallet"}
              </span>
              <span>{paymentMethod?.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Account Name</span>
              <span>{paymentMethod?.accountName}</span>
            </div>
            {paymentMethod?.type === "bank" && (
              <div className="flex justify-between items-center">
                <span>Account Number</span>
                <span>{paymentMethod?.bankAccountNumber}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Email</span>
              <span>{paymentMethod?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Mobile Number</span>
              <span>{paymentMethod?.phoneNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Alias</span>
              <span>{paymentMethod?.alias ?? "--"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Checkbox
            className="mt-1"
            onCheckedChange={(e) => setHasAcknowledged(e === true)}
            id="acknowledge"
          />
          <Label htmlFor="acknowledge">
            I acknowledge that all information provided above is accurate and
            final, and I authorize the payment processor to proceed with my USDT
            transfer. Stack’d will not be responsible for any incorrect or
            incomplete recipient details.
          </Label>
        </div>

        <Button
          size={"lg"}
          className="w-full"
          disabled={!hasAcknowledged}
          onClick={placeOrder}
        >
          Place Order
        </Button>
      </div>

      <Modal
        isOpen={isLoading}
        onClose={() => { }}
        title=""
        message="Creating order..."
        icon={<Loading size="lg" />}
        showCloseButton={false}
        showActionButtons={false}
      />

      <Modal
        isOpen={errorMessage !== undefined}
        onClose={() => setErrorMessage(undefined)}
        title="Failed to create order"
        message={errorMessage}
        icon={<AlertTriangleIcon size="48" />}
        showCloseButton={true}
        showActionButtons={true}
        secondaryButtonText="Dismiss"
        secondaryButtonAction={() => setErrorMessage(undefined)}
      />
    </div>
  );
};

export default ReviewOrder;
