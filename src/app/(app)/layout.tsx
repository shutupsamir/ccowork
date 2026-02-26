import { ClerkProvider } from '@clerk/nextjs';
import { AppShell } from '@/components/app/app-shell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <AppShell>{children}</AppShell>
    </ClerkProvider>
  );
}
