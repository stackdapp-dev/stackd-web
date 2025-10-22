"use client";

import LoginScreen from "@/components/modules/auth/LoginScreen";
import WalletScreen from "@/components/modules/wallet/WalletScreen";
import { FullScreenLoader } from "@/components/orig/ui/fullscreen-loader";
import { usePrivy } from "@privy-io/react-auth";
import { ToastContainer } from "react-toastify";

function Home() {
  const { ready, authenticated } = usePrivy();
  if (!ready) {
    return <FullScreenLoader />;
  }

  return (
    <div>
      {authenticated ? <WalletScreen /> : <LoginScreen />}

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        limit={1}
        aria-label="Toast notifications"
        style={{ top: 58 }}
      />
    </div>
  );
}

export default Home;
