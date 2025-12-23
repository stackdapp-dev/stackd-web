import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

const LoginScreen = () => {
  const { login } = usePrivy();

  return (
    <div className="flex pt-24 flex-col gap-16 items-center px-8">
      <Image src="/login-logo.png" alt="Stack'd Logo" width={164} height={26} />
      <Image src="/login-art.png" alt="Stack BTC" width={194} height={254} />
      <Button
        variant="ghost"
        className="w-full text-lg font-semibold"
        size="lg"
        onClick={() => login()}
      >
        Get Started
      </Button>
      <p className="text-center text-white/75">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};

export default LoginScreen;
