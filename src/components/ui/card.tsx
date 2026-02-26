'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const cardVariants = {
  default: '',
  interactive:
    'cursor-pointer transition-colors duration-200 ease-out hover:border-focusBlue/40 hover:bg-bgSecondary/80',
} as const;

export type CardVariant = keyof typeof cardVariants;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-bgSecondary border border-borderNeutral rounded-card p-4 md:p-6',
          cardVariants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
