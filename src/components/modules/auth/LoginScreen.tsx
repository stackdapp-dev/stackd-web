import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

const LoginScreen = () => {
  const { login } = usePrivy();

  return (
    <div className="flex pt-24 flex-col gap-16 items-center px-8">
      <Image src="/login-logo.png" alt="Stack'd Logo" width={164} height={26} />
      <Image src="/login-art.png" alt="Stack BTC" width={194} height={254} />
      <div className="w-full flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full text-lg font-semibold h-12"
          onClick={() => login({ loginMethods: ["email"] })}
        >
          Login with Email
        </Button>
        <Button
          variant="outline"
          className="w-full text-lg font-semibold h-12"
          onClick={() => login({ loginMethods: ["wallet"] })}
        >
          Continue with a Wallet
        </Button>
        <Button
          variant="ghost"
          className="w-full text-lg font-semibold h-12 text-primary hover:text-primary/80"
          onClick={() => login({ loginMethods: ["passkey"] })}
        >
          Login with Passkey
        </Button>
      </div>
      <p className="text-center text-white/75">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};

export default LoginScreen;
