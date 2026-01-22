"use client";

import LoginScreen from "@/components/modules/auth/LoginScreen";
import ReferralGate from "@/components/modules/auth/ReferralGate";
import { FullScreenLoader } from "@/components/orig/ui/fullscreen-loader";
import { useReferralGate } from "@/hooks/useReferralGate";
import { usePrivy } from "@privy-io/react-auth";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";

function Home() {
  const { ready, authenticated } = usePrivy();
  const { isValidated, isLoading, error, validateCode } = useReferralGate();
  const [showLogin, setShowLogin] = useState(false);

  // Set html background to black for login page overscroll, restore on unmount
  useEffect(() => {
    const originalBgColor = "#020617";
    document.documentElement.style.backgroundColor = "#000000";

    return () => {
      document.documentElement.style.backgroundColor = originalBgColor;
    };
  }, []);

  // Show loader while Privy or referral gate is initializing
  if (!ready || isLoading) {
    return <FullScreenLoader />;
  }

  // Authenticated users go to wallet
  if (authenticated) {
    redirect("/wallet");
  }

  // If referral is validated, allow login
  // Also allow if showLogin is true (user just validated)
  const canShowLogin = isValidated || showLogin;

  return (
    <div>
      {canShowLogin ? (
        <LoginScreen />
      ) : (
        <ReferralGate
          onValidated={() => setShowLogin(true)}
          initialError={error}
          validateCode={validateCode}
          isLoading={isLoading}
        />
      )}

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
