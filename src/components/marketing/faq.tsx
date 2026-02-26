'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Is it really free?',
    answer: 'Yes. CCowork is free.',
  },
  {
    question: 'Do I need a camera?',
    answer:
      "A camera helps but isn't required. Audio is enough to create presence.",
  },
  {
    question: 'How does matching work?',
    answer:
      'You choose a session length and we pair you with someone who chose the same. Matching takes under 5 minutes.',
  },
  {
    question: "What if my partner doesn't show?",
    answer:
      'Sessions are marked accordingly. You can match again immediately.',
  },
] as const;

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-borderNeutral">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-4 text-left transition-colors duration-200 hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focusBlue focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary rounded-button"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-textPrimary">{question}</span>
        <ChevronDown
          size={18}
          className={cn(
            'shrink-0 text-textMuted transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-textMuted">
          {answer}
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-2xl font-semibold text-textPrimary sm:text-3xl">
          FAQ
        </h2>

        <div className="mt-10">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
