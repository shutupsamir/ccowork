import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/sign-in', '/sign-up', '/legal', '/api/inngest'];

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

// Check if Clerk is properly configured
const hasClerk =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_') ?? false;

export default async function middleware(request: NextRequest) {
  if (!hasClerk) {
    // Clerk not configured — allow public routes, block protected ones
    if (isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }
    // Redirect to home if trying to access protected route without Clerk
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Clerk is configured — use Clerk middleware
  const { clerkMiddleware, createRouteMatcher } = await import(
    '@clerk/nextjs/server'
  );

  const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/legal(.*)',
    '/api/inngest(.*)',
  ]);

  const handler = clerkMiddleware((auth, req) => {
    if (!isPublicRoute(req)) {
      auth().protect();
    }
  });

  return handler(request, {} as any);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
