import { Copy } from "lucide-react";
import { showSuccessToast, showErrorToast } from "../ui/custom-toast";

const WalletAddressWithCopyButton = ({
  walletAddress,
}: {
  walletAddress: string;
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      showSuccessToast("Copied");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      showErrorToast("Clipboard Copy Didn't Work");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-white/40 text-sm">Wallet Address</div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 text-left group cursor-pointer hover:opacity-80 transition-opacity"
      >
        <Copy className="h-4 w-4 text-white/60 shrink-0" />
        <span className="break-all text-white text-sm">{walletAddress}</span>
      </button>
    </div>
  );
};

export default WalletAddressWithCopyButton;
