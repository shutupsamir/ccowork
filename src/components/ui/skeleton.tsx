import { cn } from '@/lib/utils';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
}

export function Skeleton({ width, height, rounded = 'rounded-button', className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-borderNeutral', rounded, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
