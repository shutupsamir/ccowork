'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto max-w-2xl"
      >
        <h1 className="font-accent text-4xl font-bold tracking-tight text-textPrimary sm:text-5xl md:text-6xl">
          Presence creates progress.
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-lg text-textMuted">
          Instant coworking sessions that help you start, focus, and finish.
        </p>

        <div className="mt-10">
          <Link
            href="/app/match"
            className="inline-flex h-12 items-center justify-center rounded-button bg-focusBlue px-8 text-base font-medium text-white transition-colors duration-200 hover:bg-focusBlue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focusBlue focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary"
          >
            Match me now
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
