"use client";

import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export type StepStatus = "completed" | "current" | "pending" | "failed" | "refunded";

export interface ProgressStepProps {
  label: string;
  status: StepStatus;
  stepIndex: number;
  icon?: ReactNode;
  showConnector?: boolean;
  connectorStatus?: "completed" | "pending";
}

export function ProgressStep({
  label,
  status,
  stepIndex,
  icon,
  showConnector = false,
  connectorStatus = "pending",
}: ProgressStepProps) {
  const stepNumber = stepIndex + 1;

  const getStepStyles = () => {
    switch (status) {
      case "completed":
        return "bg-emerald-500 border-emerald-500 text-white";
      case "current":
        return "bg-amber-500 border-amber-500 text-white animate-pulse";
      case "failed":
        return "bg-red-500 border-red-500 text-white";
      case "refunded":
        return "bg-blue-500 border-blue-500 text-white";
      case "pending":
      default:
        return "bg-gray-700 border-gray-600 text-gray-400";
    }
  };

  const getConnectorStyles = () => {
    return connectorStatus === "completed"
      ? "bg-emerald-500"
      : "bg-gray-600";
  };

  const renderStepContent = () => {
    if (status === "completed") {
      return (
        <Check
          data-testid={`step-${stepIndex}-checkmark`}
          className="h-4 w-4"
        />
      );
    }

    if (status === "failed") {
      return (
        <AlertCircle
          data-testid={`step-${stepIndex}-error-icon`}
          className="h-4 w-4"
        />
      );
    }

    if (status === "refunded") {
      return (
        <Check
          data-testid={`step-${stepIndex}-checkmark`}
          className="h-4 w-4"
        />
      );
    }

    // For current and pending states, show the step number
    return (
      <span data-testid={`step-${stepIndex}-number`}>
        {stepNumber}
      </span>
    );
  };

  return (
    <div className="flex items-center flex-1">
      <div
        data-testid={`progress-step-${stepIndex}`}
        data-status={status}
        className={cn(
          "flex flex-col items-center gap-2",
          status === "completed" && "text-emerald-500",
          status === "current" && "text-amber-500 animate-pulse",
          status === "pending" && "text-gray-400",
          status === "failed" && "text-red-500",
          status === "refunded" && "text-blue-500"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-medium",
            getStepStyles()
          )}
        >
          {icon || renderStepContent()}
        </div>
        <span className="text-xs font-medium whitespace-nowrap">{label}</span>
      </div>

      {showConnector && (
        <div
          data-testid={`connector-${stepIndex}-${stepIndex + 1}`}
          className={cn(
            "flex-1 h-0.5 mx-2 -mt-6",
            getConnectorStyles()
          )}
        />
      )}
    </div>
  );
}

export default ProgressStep;
