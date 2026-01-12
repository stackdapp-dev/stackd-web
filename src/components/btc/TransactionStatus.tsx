'use client';

import { cn } from '@/lib/utils';
import Card from '@/components/ui/card';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';

type StatusStep = {
  label: string;
  status: 'pending' | 'current' | 'completed' | 'failed';
};

interface TransactionStatusProps {
  type: 'deposit' | 'withdrawal';
  status: string;
  txHash?: string;
  confirmations?: number;
  error?: string;
  className?: string;
}

const DEPOSIT_STEPS: Record<string, StatusStep[]> = {
  pending: [
    { label: 'Waiting for deposit', status: 'current' },
    { label: 'Confirming', status: 'pending' },
    { label: 'Completed', status: 'pending' },
  ],
  detected: [
    { label: 'Deposit detected', status: 'completed' },
    { label: 'Confirming', status: 'current' },
    { label: 'Completed', status: 'pending' },
  ],
  confirming: [
    { label: 'Deposit detected', status: 'completed' },
    { label: 'Confirming', status: 'current' },
    { label: 'Completed', status: 'pending' },
  ],
  completed: [
    { label: 'Deposit detected', status: 'completed' },
    { label: 'Confirmed', status: 'completed' },
    { label: 'Completed', status: 'completed' },
  ],
  failed: [
    { label: 'Deposit detected', status: 'completed' },
    { label: 'Processing', status: 'completed' },
    { label: 'Failed', status: 'failed' },
  ],
};

const WITHDRAWAL_STEPS: Record<string, StatusStep[]> = {
  pending: [
    { label: 'Initiated', status: 'current' },
    { label: 'Processing', status: 'pending' },
    { label: 'Completed', status: 'pending' },
  ],
  approved: [
    { label: 'Approved', status: 'completed' },
    { label: 'Processing', status: 'current' },
    { label: 'Completed', status: 'pending' },
  ],
  processing: [
    { label: 'Initiated', status: 'completed' },
    { label: 'Processing', status: 'current' },
    { label: 'Completed', status: 'pending' },
  ],
  completed: [
    { label: 'Initiated', status: 'completed' },
    { label: 'Processed', status: 'completed' },
    { label: 'Completed', status: 'completed' },
  ],
  failed: [
    { label: 'Initiated', status: 'completed' },
    { label: 'Processing', status: 'completed' },
    { label: 'Failed', status: 'failed' },
  ],
};

function getSteps(type: 'deposit' | 'withdrawal', status: string): StatusStep[] {
  const stepsMap = type === 'deposit' ? DEPOSIT_STEPS : WITHDRAWAL_STEPS;
  return stepsMap[status] || stepsMap['pending'];
}

function StepIcon({ status }: { status: StatusStep['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
        <Check className="w-4 h-4 text-green-400" />
      </div>
    );
  }
  if (status === 'current') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#ffa02d]/20 flex items-center justify-center animate-pulse">
        <Loader2 className="w-4 h-4 text-[#ffa02d] animate-spin" />
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-4 h-4 text-red-400" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
      <Clock className="w-4 h-4 text-white/40" />
    </div>
  );
}

export function TransactionStatus({
  type,
  status,
  txHash,
  confirmations,
  error,
  className,
}: TransactionStatusProps) {
  const steps = getSteps(type, status);

  return (
    <Card appearance="glass" className={cn('space-y-4', className)}>
      <h3 className="text-lg font-medium text-white">Transaction Status</h3>

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-4">
            <StepIcon status={step.status} />
            <div className="flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' && 'text-green-400',
                  step.status === 'current' && 'text-[#ffa02d]',
                  step.status === 'failed' && 'text-red-400',
                  step.status === 'pending' && 'text-white/40'
                )}
              >
                {step.label}
              </p>
              {step.status === 'current' && confirmations !== undefined && (
                <p className="text-xs text-white/60">
                  {confirmations} confirmations
                </p>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="absolute left-4 mt-8 w-0.5 h-4 bg-white/10" />
            )}
          </div>
        ))}
      </div>

      {/* Transaction Hash */}
      {txHash && (
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/60 mb-1">Transaction Hash</p>
          <a
            href={`https://arbiscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#ffa02d] hover:underline break-all"
          >
            {txHash}
          </a>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
