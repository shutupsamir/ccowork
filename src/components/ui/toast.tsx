'use client';

import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  toasts: Toast[];
  toast: (type: ToastType, message: string) => void;
  dismiss: (id: string) => void;
}

/* ─── Context ─── */

export const ToastContext = createContext<ToastContextValue | null>(null);

/* ─── Icons ─── */

const toastIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

const toastStyles: Record<ToastType, string> = {
  success: 'border-success/40 text-success',
  error: 'border-error/40 text-error',
  info: 'border-focusBlue/40 text-focusBlue',
};

/* ─── Provider ─── */

let toastCounter = 0;

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-card border bg-bgSecondary p-4 shadow-lg',
                toastStyles[t.type]
              )}
              role="alert"
            >
              <span className="shrink-0 mt-0.5">{toastIcons[t.type]}</span>
              <p className="flex-1 text-sm text-textPrimary">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-button p-1 text-textMuted transition-colors duration-200 ease-out hover:text-textPrimary"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
