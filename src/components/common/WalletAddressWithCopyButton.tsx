import { Copy } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const WalletAddressWithCopyButton = ({
  walletAddress,
}: {
  walletAddress: string;
}) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-neutral-400 text-sm">Wallet Address</div>
      <div className="flex items-center gap-4">
        <div className="break-all text-white">{walletAddress}</div>
        <TooltipProvider>
          <Tooltip open={showCopied}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-primary"
              >
                <Copy className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Copied!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default WalletAddressWithCopyButton;
