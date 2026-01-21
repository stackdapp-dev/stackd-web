import { NETWORK_METADATA } from "@/constants/Networks";
import Image from "next/image";

interface NetworkIconProps {
  network: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function NetworkIcon({ network, width = 24, height = 24, className }: NetworkIconProps) {
  const networkKey = network.toLowerCase();
  const networkData = NETWORK_METADATA[networkKey];
  const source = networkData?.icon;

  if (!source) {
    // Fallback to first letter with network-specific colors
    const colors: Record<string, { bg: string; text: string }> = {
      arbitrum: { bg: "bg-blue-500/20", text: "text-blue-400" },
      ethereum: { bg: "bg-purple-500/20", text: "text-purple-400" },
    };
    const colorScheme = colors[networkKey] || { bg: "bg-gray-500/20", text: "text-gray-400" };

    return (
      <div
        className={`flex items-center justify-center rounded-full ${colorScheme.bg} ${colorScheme.text} font-bold text-[10px] ${className}`}
        style={{ width, height }}
      >
        {network[0]?.toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={source}
      alt={`${networkData.name} network`}
      width={width}
      height={height}
      className={`rounded-full ${className}`}
    />
  );
}
