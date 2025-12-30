"use client";

import { cn } from "@/lib/utils";
import type { Status, TransactionType } from "@/types/transaction";
import Card from "@/components/ui/card";
import { ProgressStep, type StepStatus } from "./ProgressStep";

export type { StepStatus };

export interface ProgressStep {
  label: string;
  status: StepStatus;
}

interface StepLabels {
  step1: string;
  step2: string;
  step3Completed: string;
  step3Failed: string;
  step3Refunded: string;
}

const STEP_LABELS: Record<TransactionType, StepLabels> = {
  otc_withdrawal: {
    step1: "Initiated",
    step2: "Processing",
    step3Completed: "Completed",
    step3Failed: "Failed",
    step3Refunded: "Refunded",
  },
  otc_refund: {
    step1: "Initiated",
    step2: "Processing",
    step3Completed: "Completed",
    step3Failed: "Failed",
    step3Refunded: "Refunded",
  },
  deposit: {
    step1: "Detected",
    step2: "Confirming",
    step3Completed: "Credited",
    step3Failed: "Failed",
    step3Refunded: "Refunded",
  },
  transfer: {
    step1: "Initiated",
    step2: "Pending",
    step3Completed: "Confirmed",
    step3Failed: "Failed",
    step3Refunded: "Refunded",
  },
};

/**
 * Returns the progress steps for a transaction based on its status and type.
 * Each transaction type has specific labels for each step.
 */
export function getStepsForTransaction(
  status: Status,
  type: TransactionType
): ProgressStep[] {
  const labels = STEP_LABELS[type];

  // Determine step statuses based on transaction status
  let step1Status: StepStatus = "pending";
  let step2Status: StepStatus = "pending";
  let step3Status: StepStatus = "pending";
  let step3Label = labels.step3Completed;

  switch (status) {
    case "open":
      step1Status = "current";
      step2Status = "pending";
      step3Status = "pending";
      break;
    case "processing":
      step1Status = "completed";
      step2Status = "current";
      step3Status = "pending";
      break;
    case "fulfilled":
      step1Status = "completed";
      step2Status = "completed";
      step3Status = "completed";
      step3Label = labels.step3Completed;
      break;
    case "failed":
      step1Status = "completed";
      step2Status = "completed";
      step3Status = "failed";
      step3Label = labels.step3Failed;
      break;
    case "refunded":
      step1Status = "completed";
      step2Status = "completed";
      step3Status = "refunded";
      step3Label = labels.step3Refunded;
      break;
  }

  return [
    { label: labels.step1, status: step1Status },
    { label: labels.step2, status: step2Status },
    { label: step3Label, status: step3Status },
  ];
}

/**
 * Calculates the current progress value for aria-valuenow
 * Returns 1 for open, 2 for processing, 3 for terminal states
 */
function getProgressValue(status: Status): number {
  switch (status) {
    case "open":
      return 1;
    case "processing":
      return 2;
    case "fulfilled":
    case "failed":
    case "refunded":
      return 3;
    default:
      return 1;
  }
}

export interface TransactionProgressIndicatorProps {
  status: Status;
  type: TransactionType;
  className?: string;
}

export function TransactionProgressIndicator({
  status,
  type,
  className,
}: TransactionProgressIndicatorProps) {
  const steps = getStepsForTransaction(status, type);
  const progressValue = getProgressValue(status);

  return (
    <Card
      appearance="glassDark"
      className={cn("rounded-xl", className)}
      data-testid="transaction-progress-indicator"
      aria-label="Transaction progress indicator"
    >
      <div
        role="progressbar"
        aria-valuenow={progressValue}
        aria-valuemin={0}
        aria-valuemax={3}
        aria-label={`Transaction progress: step ${progressValue} of 3`}
        className="flex items-start justify-between"
      >
        {steps.map((step, index) => {
          const isLastStep = index === steps.length - 1;

          // Determine connector status: completed if the next step is not pending
          const connectorStatus: "completed" | "pending" =
            index < steps.length - 1 && steps[index + 1].status !== "pending"
              ? "completed"
              : "pending";

          return (
            <ProgressStep
              key={index}
              stepIndex={index}
              label={step.label}
              status={step.status}
              showConnector={!isLastStep}
              connectorStatus={connectorStatus}
            />
          );
        })}
      </div>
    </Card>
  );
}

export default TransactionProgressIndicator;
