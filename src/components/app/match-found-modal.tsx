'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export interface MatchFoundModalProps {
  open: boolean;
  sessionId: string;
  onClose?: () => void;
}

export function MatchFoundModal({ open, sessionId, onClose }: MatchFoundModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  const joinSession = useCallback(() => {
    router.push(`/app/session/${sessionId}`);
  }, [router, sessionId]);

  useEffect(() => {
    if (!open) {
      setCountdown(3);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          joinSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, joinSession]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-sm bg-bgSecondary border border-borderNeutral rounded-card p-6 text-center"
            >
              <h2 className="text-xl font-semibold text-textPrimary mb-2">Match found.</h2>
              <p className="text-textMuted text-sm mb-6">Your coworking session is ready.</p>

              <Button onClick={joinSession} className="w-full mb-3">
                Join session
              </Button>

              <p className="text-xs text-textMuted">
                Auto-joining in {countdown}s...
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
