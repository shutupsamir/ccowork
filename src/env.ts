import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  TWILIO_ACCOUNT_SID: z.string().min(1, 'TWILIO_ACCOUNT_SID is required'),
  TWILIO_API_KEY_SID: z.string().min(1, 'TWILIO_API_KEY_SID is required'),
  TWILIO_API_KEY_SECRET: z
    .string()
    .min(1, 'TWILIO_API_KEY_SECRET is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().min(1, 'NEXT_PUBLIC_APP_URL is required'),
  INNGEST_EVENT_KEY: z.string().optional(),
});

function getEnv() {
  // Skip validation during build if env vars aren't set
  if (process.env.SKIP_ENV_VALIDATION === '1') {
    return process.env as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      'Invalid environment variables:',
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
    );
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = getEnv();
