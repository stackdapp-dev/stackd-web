import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import Link from "next/link";
import { Mail, Wallet, KeyRound, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const LoginScreen = () => {
  const { login } = usePrivy();
  const [showOtherOptions, setShowOtherOptions] = useState(false);

  return (
    <div
      data-testid="login-container"
      className="flex min-h-screen flex-col items-center px-8 py-12 bg-black"
    >
      {/* Top section - BETA Badge, Logo, Animation (pushed down 20%) */}
      <div className="flex flex-col items-center pt-[12vh]">
        {/* BETA Badge at top */}
        <Badge
          data-testid="login-beta-badge"
          variant="beta"
          showDot
          dotColor="#f59e0b"
          className="mb-8"
        >
          BETA
        </Badge>

        {/* Stack'd Logo - sized to match button container width (max-w-xs = 320px) */}
        <div className="flex items-center gap-3 mb-8">
          <Image
            src="/login-logo.png"
            alt="Stack'd Logo"
            width={280}
            height={45}
            priority
            className="w-auto h-auto max-w-[280px]"
          />
        </div>

        {/* Animated Stacking Lines */}
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-28">
          {/* Line 1 (bottom - drops first - LEFT aligned) */}
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="absolute bottom-0 left-0 w-[130px] h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
          />

          {/* Line 2 (3rd from bottom - drops second - RIGHT aligned) */}
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.6,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="absolute bottom-6 right-0 w-[130px] h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
          />

          {/* Line 3 (2nd from bottom - drops third - LEFT aligned) */}
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.9,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="absolute bottom-12 left-0 w-[130px] h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
          />

          {/* Line 4 (top - drops last - RIGHT aligned) */}
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 1.2,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="absolute bottom-[4.5rem] right-0 w-[130px] h-2.5 bg-[#ffa02d] rounded-full shadow-lg shadow-[#ffa02d]/50"
          />
        </div>
        </div>
      </div>

      {/* Spacer to push buttons down */}
      <div className="flex-1 min-h-[10vh]" />

      {/* Login Buttons Container - 30% smaller, positioned lower */}
      <div
        data-testid="login-buttons-container"
        className="w-full max-w-xs flex flex-col gap-3"
      >
        {/* Connect External Wallet - Primary Action (30% smaller) */}
        <Button
          data-testid="login-wallet-button"
          className="w-full text-base font-semibold h-10 bg-amber-500 hover:bg-amber-600 text-black"
          onClick={() => login({ loginMethods: ["wallet"] })}
        >
          <Wallet
            data-testid="login-wallet-icon"
            className="w-4 h-4 mr-2"
            strokeWidth={2}
          />
          Connect External Wallet
        </Button>

        {/* Other Login Options Dropdown (30% smaller) */}
        <Button
          data-testid="login-other-options-button"
          variant="outline"
          className="w-full text-base font-semibold h-10 bg-[#1a1a1a] border-white/20 hover:border-white/30 text-white/80 hover:text-white hover:bg-[#1a1a1a]"
          onClick={() => setShowOtherOptions(!showOtherOptions)}
        >
          Other Login Options
          <ChevronDown
            data-testid="login-other-options-chevron"
            className={`w-4 h-4 ml-2 transition-transform duration-200 ${showOtherOptions ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </Button>

        {/* Expandable Options (30% smaller) */}
        <AnimatePresence>
          {showOtherOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 overflow-hidden"
            >
              {/* Login with Email */}
              <div className="relative">
                <Badge
                  data-testid="login-email-badge"
                  variant="beta"
                  showDot
                  dotColor="#f59e0b"
                  className="absolute -top-2.5 left-3 z-10 text-xs"
                >
                  BETA
                </Badge>
                <Button
                  data-testid="login-email-button"
                  variant="outline"
                  className="w-full text-base font-semibold h-10 bg-[#1a1a1a] border-amber-900/60 hover:border-amber-800/80 text-amber-500 hover:text-amber-400 hover:bg-[#1a1a1a]"
                  onClick={() => login({ loginMethods: ["email"] })}
                >
                  <Mail
                    data-testid="login-email-icon"
                    className="w-4 h-4 mr-2 text-amber-500"
                    strokeWidth={2}
                  />
                  Login with Email
                </Button>
              </div>

              {/* Login with Passkey */}
              <div className="relative">
                <Badge
                  data-testid="login-passkey-badge"
                  variant="beta"
                  showDot
                  dotColor="#f59e0b"
                  className="absolute -top-2.5 left-3 z-10 text-xs"
                >
                  BETA
                </Badge>
                <Button
                  data-testid="login-passkey-button"
                  variant="outline"
                  className="w-full text-base font-semibold h-10 bg-[#1a1a1a] border-amber-900/60 hover:border-amber-800/80 text-amber-500 hover:text-amber-400 hover:bg-[#1a1a1a]"
                  onClick={() => login({ loginMethods: ["passkey"] })}
                >
                  <KeyRound
                    data-testid="login-passkey-icon"
                    className="w-4 h-4 mr-2 text-amber-500"
                    strokeWidth={2}
                  />
                  Login with Passkey
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Terms and Privacy Policy */}
      <p className="text-center text-white/60 mt-8 text-sm">
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="text-white/80 underline underline-offset-2 hover:text-white"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-white/80 underline underline-offset-2 hover:text-white"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
};

export default LoginScreen;
