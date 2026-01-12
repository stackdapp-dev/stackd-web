'use client';

import { useState, useCallback, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateBtcAddress, validateEvmAddress } from '@/lib/btc/addressValidator';

interface AddressInputProps {
  type: 'btc' | 'evm';
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function AddressInput({
  type,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  disabled,
  'data-testid': testId,
}: AddressInputProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback(
    (address: string) => {
      if (!address.trim()) {
        return null; // Don't show error for empty input
      }

      if (type === 'btc') {
        const result = validateBtcAddress(address);
        if (!result.valid) {
          return 'Invalid BTC address';
        }
        // Check for testnet addresses
        if (result.valid && result.network === 'testnet') {
          return 'Testnet addresses not supported';
        }
      } else {
        const result = validateEvmAddress(address);
        if (!result.valid) {
          return result.error || 'Invalid address';
        }
      }

      return null;
    },
    [type]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear error while typing
    if (touched && error) {
      setError(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validate(value);
    setError(validationError);
    onBlur?.();
  };

  const handleClear = () => {
    onChange('');
    setError(null);
    setTouched(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-sm text-white/80">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder || (type === 'btc' ? 'bc1q...' : '0x...')}
          disabled={disabled}
          className={cn(
            'bg-white/5 border-white/10 text-white pr-10',
            error && touched && 'border-red-500/50 focus:ring-red-500/30'
          )}
          data-testid={testId}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && touched && (
        <p className="text-xs text-red-400" data-testid={testId ? `${testId}-error` : undefined}>
          {error}
        </p>
      )}
    </div>
  );
}
