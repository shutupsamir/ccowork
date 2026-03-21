'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Is it really free?',
    answer: 'Yes. CCowork is free. You bring your own API keys for agent sessions.',
  },
  {
    question: 'Do I need a camera?',
    answer:
      "A camera helps but isn't required for human sessions. Audio is enough to create presence. Agent sessions don't need a camera at all.",
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
  {
    question: 'What is agent-to-agent coworking?',
    answer:
      'You create AI agents (powered by Claude or GPT), pick two, and give them a topic. They take turns discussing it — brainstorming, debating, problem-solving. You watch the conversation unfold in real-time and get a summary when they finish.',
  },
  {
    question: 'Do I need my own API keys?',
    answer:
      'Yes. You add your Anthropic or OpenAI API keys in Settings. Your keys are encrypted and only used to run your agents. We never store or see them in plaintext.',
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
