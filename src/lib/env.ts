import { z } from 'zod';

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32),
  // Legacy fallback until Phase 11: builds URLs for images not yet moved to the media library.
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),

  MEDIA_DRIVER: z.enum(['local', 's3']).default('local'),
  MEDIA_LOCAL_DIR: z.string().min(1).default('.uploads'),
  MEDIA_PUBLIC_URL: z.string().url().optional(),
  MEDIA_KEY_PREFIX: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'MEDIA_KEY_PREFIX must match /^[a-z0-9-]+$/')
    .default('vantage'),
  S3_ACCOUNT_ID: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  APP_ENCRYPTION_KEY: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.stringbool().optional(),
  MAIL_FROM: z.string().optional(),

  AI_PROVIDER_MOCK: z.stringbool().optional(),
  DISABLE_CUSTOM_SCRIPTS: z.stringbool().optional(),
  SEED_DEMO_USERS: z.stringbool().optional(),
  // Loopback origin the proxy uses to reach the redirect resolver; defaults per environment.
  INTERNAL_ORIGIN: z.string().url().optional(),
  // Whether this deployment may be indexed. MUST be 'production' on the live VPS (crawlers are blocked otherwise).
  SITE_ENV: z.enum(['production', 'preview', 'development']).optional(),
});

const serverEnvSchema = serverSchema.superRefine((env, ctx) => {
  if (env.MEDIA_DRIVER !== 's3') return;
  for (const key of ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const) {
    if (!env[key]) {
      ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when MEDIA_DRIVER=s3` });
    }
  }
  if (!env.MEDIA_PUBLIC_URL) {
    ctx.addIssue({
      code: 'custom',
      path: ['MEDIA_PUBLIC_URL'],
      message: 'MEDIA_PUBLIC_URL is required when MEDIA_DRIVER=s3',
    });
  }
  if (!env.S3_ACCOUNT_ID && !env.S3_ENDPOINT) {
    for (const key of ['S3_ACCOUNT_ID', 'S3_ENDPOINT'] as const) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: 'S3_ACCOUNT_ID or S3_ENDPOINT is required when MEDIA_DRIVER=s3',
      });
    }
  }
  if (env.MEDIA_PUBLIC_URL && !env.MEDIA_PUBLIC_URL.startsWith('https://')) {
    ctx.addIssue({
      code: 'custom',
      path: ['MEDIA_PUBLIC_URL'],
      message: 'MEDIA_PUBLIC_URL must be https when MEDIA_DRIVER=s3',
    });
  }
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

// Client vars must be referenced literally — Next.js inlines them at build time.
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

/** Pure parser (no process.env access) so tests can pass their own env. Empty strings count as unset. */
export const parseServerEnv = (env: Record<string, string | undefined>) =>
  serverEnvSchema.parse(Object.fromEntries(Object.entries(env).filter(([, v]) => v !== '')));

export const serverEnv = () => {
  if (typeof window !== 'undefined') throw new Error('serverEnv() called in the browser');
  return parseServerEnv(process.env);
};
