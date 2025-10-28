import { LoaderCircle } from 'lucide-react';
import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <LoaderCircle className={`animate-spin text-amber-500 ${sizeClasses[size]}`} />
    </div>
  );
};