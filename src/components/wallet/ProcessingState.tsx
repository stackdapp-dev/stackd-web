"use client";

import React from "react";
import { Loading } from "@/components/ui/loading";
import Text from "@/components/ui/text";

export interface ProcessingStateProps {
  state: "processing" | "approving" | "confirming";
  message?: string;
}

const DEFAULT_MESSAGES: Record<ProcessingStateProps["state"], string> = {
  processing: "Processing your transaction.",
  approving: "Please approve token spending in your wallet.",
  confirming: "Waiting for blockchain confirmation...",
};

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  state,
  message,
}) => {
  const displayMessage = message ?? DEFAULT_MESSAGES[state];

  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <Loading />
      <Text tone="muted" className="text-center text-white/60">
        {displayMessage}
      </Text>
    </div>
  );
};
