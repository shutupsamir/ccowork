import Link from 'next/link';
import { Hero } from '@/components/marketing/hero';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Benefits } from '@/components/marketing/benefits';
import { FAQ } from '@/components/marketing/faq';
import { Footer } from '@/components/marketing/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bgPrimary">
      {/* Minimal top bar */}
      <header className="sticky top-0 z-50 border-b border-borderNeutral bg-bgPrimary/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold text-textPrimary select-none"
          >
            CCowork
          </Link>

          <Link
            href="/sign-in"
            className="text-sm font-medium text-textMuted transition-colors duration-200 hover:text-textPrimary"
          >
            Sign in
          </Link>
        </div>
      </header>

      <Hero />
      <HowItWorks />
      <Benefits />
      <FAQ />
      <Footer />
    </div>
  );
}
