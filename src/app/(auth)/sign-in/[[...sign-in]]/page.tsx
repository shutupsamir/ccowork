import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bgPrimary px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-bgSecondary border border-borderNeutral shadow-xl',
          },
        }}
      />
    </div>
  );
}
