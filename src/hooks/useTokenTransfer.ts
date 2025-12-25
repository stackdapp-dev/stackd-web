import { CASHOUT_MULTISIG_ADDRESS } from "@/constants/addresses";
import { encodeTransferData } from "@/lib/web3/erc20";
import { useWeb3 } from "@/providers/Web3Provider";
import { Address } from "viem";

const useTokenTransfer = () => {
  const { sendSponsoredTransaction, ensureCorrectNetwork } = useWeb3();

  const transferTo = async (
    recipient: Address,
    token: Address,
    amount: bigint
  ) => {
    try {
      await ensureCorrectNetwork();

      // Use sponsored transaction for gas-free transfer
      const data = encodeTransferData(recipient, amount);
      const result = await sendSponsoredTransaction({
        to: token,
        data,
      });

      if (result.error) {
        return { txHash: null, error: result.error };
      }
      return { txHash: result.hash, error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown transfer error";
      console.error("transfer failed", err);
      return { txHash: null, error: errorMessage };
    }
  };

  const transferToCashoutMultisig = async (token: Address, amount: bigint) => {
    return await transferTo(CASHOUT_MULTISIG_ADDRESS, token, amount);
  };

  return {
    transferTo,
    transferToCashoutMultisig,
  };
};

export default useTokenTransfer;
