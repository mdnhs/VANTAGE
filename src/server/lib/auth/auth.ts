import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, twoFactor } from 'better-auth/plugins';

import { serverEnv } from '@/lib/env';
import { ac, roles } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { accounts, rateLimits, sessions, twoFactors, users, verifications } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';

import { accountHooks } from './account-hooks';
import { deliverAuthEmail, recordAuthLink } from './email';
import { afterHook, beforeHook } from './hooks';
import { verifyPassword } from './password';
import { responseScrub } from './response-scrub';
import { signInAudit } from './sign-in-audit';
import { twoFactorPolicy } from './two-factor-policy';
import { VIEW_AS_ADMIN_ROLES, VIEW_AS_SECONDS } from './view-as-limit';

export function buildAuth() {
  const env = serverEnv();
  const appUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return betterAuth({
    appName: 'VANTAGE Admin',
    baseURL: appUrl,
    secret: env.AUTH_SECRET,
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? appUrl],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        twoFactor: twoFactors,
        rateLimit: rateLimits,
      },
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      // Accounts exist only through admin provisioning / invitation.
      disableSignUp: true,
      minPasswordLength: 8,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60 * 24,
      password: { verify: verifyPassword },
      sendResetPassword: async ({ user, url }) => {
        const { manualLink } = await deliverAuthEmail(user, url);
        if (manualLink) recordAuthLink(manualLink);
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      // Cheap reads for the UI. Admin checks bypass it (disableCookieCache).
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    user: {
      additionalFields: {
        // The bell's "seen" instant. Never accepted from a client and never
        // sent back in session payloads.
        notificationsSeenAt: { type: 'date', required: false, input: false, returned: false },
      },
    },
    hooks: { before: beforeHook, after: afterHook },
    databaseHooks: {
      session: {
        create: {
          // Impersonation starts land in the audit log. Sign-ins are audited
          // when they complete (./sign-in-audit), not per session.
          after: async (created) => {
            const impersonatedBy = (created as { impersonatedBy?: string | null }).impersonatedBy;
            if (!impersonatedBy) return;
            await audit(
              { userId: impersonatedBy, ip: created.ipAddress ?? null, userAgent: created.userAgent ?? null },
              {
                action: 'auth.impersonate',
                entityType: 'user',
                entityId: created.userId,
                summary: 'Started a View-as session',
              },
            );
          },
        },
      },
    },
    rateLimit: {
      // On in production only. Local and test runs sign in many times.
      enabled: process.env.NODE_ENV === 'production',
      storage: 'database',
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/request-password-reset': { window: 300, max: 3 },
        '/two-factor/*': { window: 60, max: 5 },
        '/change-password': { window: 300, max: 5 },
        '/reset-password': { window: 300, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: 'vantage',
      // Explicit, so tests exercise the same origin/redirect checks production runs.
      disableOriginCheck: false,
      ipAddress: { ipAddressHeaders: ['x-real-ip'] },
    },
    plugins: [
      admin({
        ac,
        // `user` = site customer: a valid role with no permissions at all.
        roles: { ...roles, user: ac.newRole({}) },
        defaultRole: 'user',
        adminRoles: [...VIEW_AS_ADMIN_ROLES],
        impersonationSessionDuration: VIEW_AS_SECONDS,
      }),
      twoFactor({
        issuer: 'VANTAGE Admin',
        // Spelled out: the sign-in screen's LOCKED copy promises exactly this.
        accountLockout: { enabled: true, maxFailedAttempts: 10, durationSeconds: 15 * 60 },
      }),
      // After twoFactor: its hook must see the challenge replace the session.
      signInAudit(),
      accountHooks(),
      twoFactorPolicy(),
      // Last: strips session tokens and IPs from JSON sent to the browser.
      responseScrub(),
    ],
  });
}

export type Auth = ReturnType<typeof buildAuth>;

let instance: Auth | undefined;

// Tests rebuild Better Auth after changing its config; the app never calls this.
export function resetAuthForTests() {
  instance = undefined;
}

// Built on first use: importing this module at build time needs no secrets.
export function getAuth(): Auth {
  instance ??= buildAuth();
  return instance;
}
