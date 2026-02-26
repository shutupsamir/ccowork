'use client';

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RatingFormProps {
  sessionId: string;
  onSubmit: (data: { rating: number; partnerShowedUp: boolean }) => void;
}

export function RatingForm({ sessionId, onSubmit }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [partnerShowedUp, setPartnerShowedUp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/session/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, rating, partnerShowedUp }),
      });

      if (!res.ok) throw new Error('Failed to submit rating');

      onSubmit({ rating, partnerShowedUp });
    } catch {
      // Allow retry
      setSubmitting(false);
    }
  }, [sessionId, rating, partnerShowedUp, onSubmit]);

  const displayRating = hoveredStar || rating;

  return (
    <div className="flex flex-col items-center gap-6">
      <h3 className="text-lg font-semibold text-textPrimary">Rate your session</h3>

      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 transition-transform hover:scale-110"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              size={28}
              className={cn(
                'transition-colors duration-150',
                star <= displayRating
                  ? 'fill-mintAccent text-mintAccent'
                  : 'fill-transparent text-textMuted'
              )}
            />
          </button>
        ))}
      </div>

      {/* Partner showed up toggle */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-textMuted">Did your partner show up?</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPartnerShowedUp(true)}
            className={cn(
              'px-4 py-1.5 rounded-button text-sm font-medium transition-colors duration-200',
              partnerShowedUp
                ? 'bg-success/20 text-success'
                : 'bg-bgSecondary text-textMuted hover:text-textPrimary'
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setPartnerShowedUp(false)}
            className={cn(
              'px-4 py-1.5 rounded-button text-sm font-medium transition-colors duration-200',
              !partnerShowedUp
                ? 'bg-error/20 text-error'
                : 'bg-bgSecondary text-textMuted hover:text-textPrimary'
            )}
          >
            No
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        loading={submitting}
        disabled={rating === 0}
        className="w-full max-w-xs"
      >
        Submit rating
      </Button>
    </div>
  );
}
