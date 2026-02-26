import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && <div className="mb-4 text-textMuted">{icon}</div>}
      <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-textMuted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
