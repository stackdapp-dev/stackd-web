import { CASHOUT_MULTISIG_ADDRESS } from "@/constants/addresses";
import { transfer } from "@/lib/web3/erc20";
import { useWeb3 } from "@/providers/Web3Provider";
import { Address } from "viem";

const useTokenTransfer = () => {
  const { walletClient, walletAddress } = useWeb3();

  const transferTo = async (
    recipient: Address,
    token: Address,
    amount: bigint
  ) => {
    if (!walletClient) {
      throw new Error("Wallet client not available");
    }

    const address = walletClient.account
      ? (walletClient.account.address as `0x${string}`)
      : walletAddress;

    try {
      const tx = await transfer(
        walletClient,
        address,
        recipient,
        token,
        amount
      );
      return { txHash: tx, error: null };
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
