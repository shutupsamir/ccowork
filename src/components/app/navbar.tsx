'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Dashboard', href: '/app' },
  { label: 'Match', href: '/app/match' },
  { label: 'Sessions', href: '/app/sessions' },
  { label: 'Settings', href: '/app/settings' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/app') return pathname === '/app';
  return pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 h-14 bg-bgPrimary border-b border-borderNeutral">
      <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4">
        {/* Logo */}
        <Link href="/app" className="text-textPrimary font-semibold text-lg select-none">
          CCowork
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-button text-sm font-medium transition-colors duration-200',
                  isActive(pathname, link.href)
                    ? 'text-textPrimary bg-bgSecondary'
                    : 'text-textMuted hover:text-textPrimary hover:bg-bgSecondary/60'
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-1.5 text-textMuted hover:text-textPrimary transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-bgPrimary border-b border-borderNeutral px-4 pb-3">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-button text-sm font-medium transition-colors duration-200',
                    isActive(pathname, link.href)
                      ? 'text-textPrimary bg-bgSecondary'
                      : 'text-textMuted hover:text-textPrimary hover:bg-bgSecondary/60'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
