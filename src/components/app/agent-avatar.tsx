'use client';

import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  status: 'ACTIVE' | 'PAUSED';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 24,
};

export function AgentAvatar({ name, avatarUrl, status, size = 'md' }: AgentAvatarProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full',
        sizeClasses[size],
        status === 'ACTIVE' && 'ring-2 ring-success ring-offset-2 ring-offset-bgPrimary',
        status === 'PAUSED' && 'ring-2 ring-borderNeutral ring-offset-2 ring-offset-bgPrimary'
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-focusBlue/10 text-focusBlue',
            sizeClasses[size]
          )}
        >
          <Bot size={iconSizes[size]} />
        </div>
      )}
    </div>
  );
}
