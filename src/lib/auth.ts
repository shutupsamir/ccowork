import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';

/**
 * Get the current authenticated user's ID. Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Require authentication. Throws if no user is authenticated.
 */
export async function requireUser(): Promise<string> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}

/**
 * Upsert a User record in the database, ensuring it exists for the given
 * Clerk userId. Creates the record on first encounter, updates email/name
 * on subsequent calls.
 */
export async function ensureDbUser(
  userId: string,
  email: string,
  name?: string | null
) {
  return prisma.user.upsert({
    where: { id: userId },
    update: { email, ...(name !== undefined && { name }) },
    create: { id: userId, email, name: name ?? null },
  });
}

/**
 * Helper that resolves the full Clerk user and ensures a DB record exists.
 * Useful in API routes that need both auth + DB user in one call.
 */
export async function requireDbUser() {
  const userId = await requireUser();
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error('Could not resolve Clerk user');
  }
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error('User has no email address');
  }
  const dbUser = await ensureDbUser(
    userId,
    email,
    clerkUser.firstName
      ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ''}`
      : null
  );
  return dbUser;
}
