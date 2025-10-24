import { TOKEN_METADATA } from "@/constants/Tokens";
import Image from "next/image";

interface TokenIconProps {
  symbol: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function TokenIcon({ symbol, width = 32, height = 32, className }: TokenIconProps) {
  const tokenData = TOKEN_METADATA[symbol as keyof typeof TOKEN_METADATA];
  const source = tokenData?.icon;

  if (!source) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-sm ${className}`}
        style={{ width, height }}
      >
        {symbol[0]?.toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={source}
      alt={`${symbol} icon`}
      width={width}
      height={height}
      className={`rounded-full ${className}`}
    />
  );
}
