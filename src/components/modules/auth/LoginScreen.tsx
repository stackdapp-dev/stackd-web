import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import Link from "next/link";
import { Mail, Wallet, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

const LoginScreen = () => {
  const { login } = usePrivy();

  return (
    <div
      data-testid="login-container"
      className="flex min-h-screen flex-col items-center justify-center px-8 py-12"
    >
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

      {/* Stack'd Logo */}
      <div className="flex items-center gap-3 mb-8">
        <Image
          src="/login-logo.png"
          alt="Stack'd Logo"
          width={164}
          height={26}
          priority
        />
      </div>

      {/* Animated Stacking Lines */}
      <div className="flex justify-center mb-16">
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

      {/* Login Buttons Container */}
      <div
        data-testid="login-buttons-container"
        className="w-full max-w-md flex flex-col gap-4"
      >
        {/* Login with Email */}
        <div className="relative">
          <Badge
            data-testid="login-email-badge"
            variant="beta"
            showDot
            dotColor="#f59e0b"
            className="absolute -top-3 left-4 z-10"
          >
            BETA
          </Badge>
          <Button
            data-testid="login-email-button"
            variant="outline"
            className="w-full text-lg font-semibold h-14 bg-[#1a1a1a] border-amber-900/60 hover:border-amber-800/80 text-amber-500 hover:text-amber-400 hover:bg-[#1a1a1a]"
            onClick={() => login({ loginMethods: ["email"] })}
          >
            <Mail
              data-testid="login-email-icon"
              className="w-5 h-5 mr-2 text-amber-500"
              strokeWidth={2}
            />
            Login with Email
          </Button>
        </div>

        {/* Connect External Wallet */}
        <div className="relative">
          <Badge
            data-testid="login-wallet-badge"
            variant="recommended"
            showDot
            dotColor="#22c55e"
            className="absolute -top-3 left-4 z-10"
          >
            RECOMMENDED
          </Badge>
          <Button
            data-testid="login-wallet-button"
            variant="outline"
            className="w-full text-lg font-semibold h-14 bg-[#1a1a1a] border-amber-900/60 hover:border-amber-800/80 text-amber-500 hover:text-amber-400 hover:bg-[#1a1a1a]"
            onClick={() => login({ loginMethods: ["wallet"] })}
          >
            <Wallet
              data-testid="login-wallet-icon"
              className="w-5 h-5 mr-2 text-amber-500"
              strokeWidth={2}
            />
            Connect External Wallet
          </Button>
        </div>

        {/* Login with Passkey */}
        <div className="relative">
          <Badge
            data-testid="login-passkey-badge"
            variant="beta"
            showDot
            dotColor="#f59e0b"
            className="absolute -top-3 left-4 z-10"
          >
            BETA
          </Badge>
          <Button
            data-testid="login-passkey-button"
            variant="outline"
            className="w-full text-lg font-semibold h-14 bg-[#1a1a1a] border-amber-900/60 hover:border-amber-800/80 text-amber-500 hover:text-amber-400 hover:bg-[#1a1a1a]"
            onClick={() => login({ loginMethods: ["passkey"] })}
          >
            <KeyRound
              data-testid="login-passkey-icon"
              className="w-5 h-5 mr-2 text-amber-500"
              strokeWidth={2}
            />
            Login with Passkey
          </Button>
        </div>
      </div>

      {/* Terms and Privacy Policy */}
      <p className="text-center text-white/60 mt-16 text-sm">
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
