import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import Link from "next/link";
import { Mail, Wallet, KeyRound } from "lucide-react";

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
      <div className="flex items-center gap-3 mb-16">
        <Image
          src="/login-logo.png"
          alt="Stack'd Logo"
          width={164}
          height={26}
          priority
        />
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
            className="w-full text-lg font-semibold h-14 bg-[#1a1a1a] border-white/20 hover:border-white/40"
            onClick={() => login({ loginMethods: ["email"] })}
          >
            <Mail
              data-testid="login-email-icon"
              className="w-5 h-5 mr-2"
              strokeWidth={2}
            />
            Login with Email
          </Button>
        </div>

        {/* Continue with a Wallet */}
        <div className="relative">
          <Badge
            data-testid="login-wallet-badge"
            variant="recommended"
            showDot
            dotColor="#22c55e"
            className="absolute -top-3 left-4 z-10"
          >
            WORKS BEST
          </Badge>
          <Button
            data-testid="login-wallet-button"
            variant="outline"
            className="w-full text-lg font-semibold h-14 bg-[#1a1a1a] border-white/20 hover:border-white/40"
            onClick={() => login({ loginMethods: ["wallet"] })}
          >
            <Wallet
              data-testid="login-wallet-icon"
              className="w-5 h-5 mr-2"
              strokeWidth={2}
            />
            Continue with a Wallet
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
            className="w-full text-lg font-semibold h-14 bg-[#1a1a1a] border-white/20 hover:border-white/40"
            onClick={() => login({ loginMethods: ["passkey"] })}
          >
            <KeyRound
              data-testid="login-passkey-icon"
              className="w-5 h-5 mr-2"
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
