import { allowance, approve } from "@/lib/web3/erc20";
import { useWeb3 } from "@/providers/Web3Provider";
import { Address } from "viem";

const useTokenApproval = () => {
  const { publicClient, walletClient, walletAddress } = useWeb3();

  const approveIfNecessary = async (
    token: Address,
    amount: bigint,
    spender: Address
  ) => {
    if (!walletClient) {
      throw new Error("Wallet client not available");
    }

    console.log("Token:", token);
    console.log("Amount to spend:", amount);
    console.log("Spender:", spender);

    const address = walletClient.account
      ? (walletClient.account.address as `0x${string}`)
      : walletAddress;

    try {
      const currAllowance = await allowance(
        publicClient,
        address,
        token,
        spender
      );
      console.log("Current allowance:", currAllowance);
      if (currAllowance >= amount) {
        console.log("allowance sufficient, no approvals needed");
        return { txHash: null, error: null };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown allowance error";
      console.error("allowance read failed", err);
      return { txHash: null, error: errorMessage };
    }

    try {
      const tx = await approve(walletClient, address, token, spender, amount);
      return { txHash: tx, error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown approval error";
      console.error("approve failed", err);
      return { txHash: null, error: errorMessage };
    }
  };

  return {
    approveIfNecessary,
  };
};

export default useTokenApproval;
