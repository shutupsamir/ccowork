import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-borderNeutral px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="text-sm font-semibold text-textPrimary">CCowork.ai</span>

        <div className="flex items-center gap-6">
          <Link
            href="/legal/privacy"
            className="text-sm text-textMuted transition-colors duration-200 hover:text-textPrimary"
          >
            Privacy
          </Link>
          <Link
            href="/legal/terms"
            className="text-sm text-textMuted transition-colors duration-200 hover:text-textPrimary"
          >
            Terms
          </Link>
        </div>

        <span className="text-xs text-textMuted">
          &copy; {year} CCowork.ai. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
