import { Button } from "@/components/ui/button";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const WalletScreen = () => {
  const { logout } = usePrivy();
  const { wallets } = useWallets();

  return (
    <div className="flex flex-col gap-8 items-center p-8">
      <div className="wrap-anywhere">
        Wallet: {wallets.length ? wallets[0].address : "Loading..."}
      </div>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
};

export default WalletScreen;
