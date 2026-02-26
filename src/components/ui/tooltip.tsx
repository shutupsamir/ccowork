'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: string;
  position?: 'top';
  children: ReactNode;
  className?: string;
}

const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] };

export function Tooltip({ content, position = 'top', children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={transition}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none',
              position === 'top' && 'bottom-full mb-2',
              'whitespace-nowrap rounded-button bg-bgSecondary border border-borderNeutral px-2.5 py-1.5 text-xs text-textPrimary shadow-lg',
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
