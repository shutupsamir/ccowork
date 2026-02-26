import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-bgSecondary text-textPrimary',
  success: 'bg-success/20 text-success',
  warning: 'bg-sandAccent/20 text-sandAccent',
  error: 'bg-error/20 text-error',
  info: 'bg-focusBlue/20 text-focusBlue',
} as const;

export type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
