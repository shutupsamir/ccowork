'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchFoundModal } from './match-found-modal';

export type MatchStatus = 'idle' | 'searching' | 'matched' | 'expired' | 'error';

export interface MatchStatusPanelProps {
  status: MatchStatus;
  elapsedSeconds: number;
  onCancel: () => void;
  onRetry?: () => void;
  matchedSessionId: string | null;
  errorMessage?: string;
}

export function MatchStatusPanel({
  status,
  elapsedSeconds,
  onCancel,
  onRetry,
  matchedSessionId,
  errorMessage,
}: MatchStatusPanelProps) {
  if (status === 'idle') return null;

  if (status === 'matched' && matchedSessionId) {
    return (
      <MatchFoundModal
        open
        sessionId={matchedSessionId}
        onClose={onCancel}
      />
    );
  }

  return (
    <Card className="text-center py-8">
      {status === 'searching' && (
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-3 h-3 rounded-full bg-focusBlue"
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-textPrimary font-medium">Finding your coworker...</p>
          <p className="text-sm text-textMuted">Searching for {elapsedSeconds}s...</p>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}

      {status === 'expired' && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-textPrimary font-medium">No match found. Try again.</p>
          <Button onClick={onRetry ?? onCancel}>Match again</Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-error font-medium">{errorMessage ?? 'Something went wrong.'}</p>
          <Button onClick={onRetry ?? onCancel}>Retry</Button>
        </div>
      )}
    </Card>
  );
}
