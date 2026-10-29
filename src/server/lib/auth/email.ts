import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';

import { renderEmail, sendMail, smtpConfigured, type MailMessage } from '@/server/lib/email/mailer';

// Invites reuse the reset flow. Better Auth builds
// `<base>/reset-password/<token>?callbackURL=<encoded redirect>`; an invite's
// redirect carries `invite=1`, so the email can be worded as an invitation.
export function isInviteLink(url: string): boolean {
  try {
    const callback = new URL(url).searchParams.get('callbackURL');
    if (!callback) return false;
    const target = new URL(callback, 'http://placeholder.invalid');
    return target.searchParams.get('invite') === '1';
  } catch {
    return false;
  }
}

type Recipient = { name: string; email: string };

// The business name from Site settings; imported lazily so this module loads without the database.
async function adminSiteName(): Promise<string> {
  const [{ getSetting }, { siteNameFrom }] = await Promise.all([
    import('@/server/queries/get-setting'),
    import('@/lib/content/site-name'),
  ]);
  try {
    return siteNameFrom((await getSetting('site')).name);
  } catch {
    return siteNameFrom(null);
  }
}
type Send = (message: MailMessage) => Promise<unknown>;

const captureStore = new AsyncLocalStorage<{ links: string[] }>();

// Runs `fn` and collects the links that could not be emailed (SMTP missing)
// while it ran, so the users API can hand them back as `manualLink`.
export async function captureAuthLinks<T>(fn: () => Promise<T>): Promise<{ result: T; links: string[] }> {
  const store = { links: [] as string[] };
  const result = await captureStore.run(store, fn);
  return { result, links: store.links };
}

// Records a link for the enclosing captureAuthLinks, if any.
export function recordAuthLink(url: string) {
  captureStore.getStore()?.links.push(url);
}

function compose(user: Recipient, url: string, siteName: string): MailMessage {
  const invite = isInviteLink(url);
  const content = invite
    ? {
        heading: `You have been invited to ${siteName}`,
        paragraphs: [
          `Hi ${user.name}, you have been invited to the ${siteName} admin.`,
          'Choose a password to activate your account. The link expires in 24 hours.',
        ],
        cta: { label: 'Set your password', url },
      }
    : {
        heading: 'Reset your password',
        paragraphs: [
          `Hi ${user.name}, we received a request to reset your ${siteName} admin password.`,
          'If this was not you, ignore this email. The link expires in 24 hours.',
        ],
        cta: { label: 'Choose a new password', url },
      };
  return {
    to: user.email,
    subject: invite ? `You have been invited to ${siteName}` : `Reset your ${siteName} password`,
    ...renderEmail(content),
  };
}

// Never throws: a failure must not change the response, or it would reveal
// which emails have accounts. Without SMTP the link is handed back instead
// (and never logged).
export async function deliverAuthEmail(
  user: Recipient,
  url: string,
  send: Send = sendMail,
  configured: () => boolean = smtpConfigured,
  siteName: () => Promise<string> = adminSiteName,
): Promise<{ manualLink?: string }> {
  if (!configured()) return { manualLink: url };
  // Fire and forget: awaiting the SMTP round-trip would make known emails
  // slower than unknown ones, revealing which have accounts.
  void siteName()
    .then((name) => send(compose(user, url, name)))
    .catch(logSendFailure);
  return {};
}

// Message only: the error object and the link (which carries the token) stay out of logs.
function logSendFailure(error: unknown) {
  console.error('[auth] could not send email', error instanceof Error ? error.message : 'unknown error');
}
