"use client";

import LoginScreen from "@/components/modules/auth/LoginScreen";
import ReferralGate from "@/components/modules/auth/ReferralGate";
import SplashScreen from "@/components/modules/auth/SplashScreen";
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
  const [showSplash, setShowSplash] = useState<boolean | null>(null);

  // Check if splash was already shown this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem("stackd_splash_shown");
    setShowSplash(splashShown !== "true");
  }, []);

  // Set html and body background to black for login page overscroll, restore on unmount
  useEffect(() => {
    const originalHtmlBg = "#020617";
    const originalBodyBg = "linear-gradient(to bottom, #020617, #0f172a, #000000)";

    document.documentElement.style.backgroundColor = "#000000";
    document.body.style.background = "#000000";

    return () => {
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.body.style.background = originalBodyBg;
    };
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("stackd_splash_shown", "true");
    setShowSplash(false);
  };

  // Show loader while Privy or referral gate is initializing, or splash state not yet determined
  if (!ready || isLoading || showSplash === null) {
    return <FullScreenLoader />;
  }

  // Show splash screen on first visit of session
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
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
