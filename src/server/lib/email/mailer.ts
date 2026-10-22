import nodemailer, { type Transporter } from 'nodemailer';

import { serverEnv } from '@/lib/env';

export type MailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult =
  | { delivered: true; messageId: string }
  | {
      delivered: false;
      reason: 'smtp_not_configured' | 'send_failed';
      error?: string;
    };

let transporter: Transporter | null = null;

export const smtpConfigured = (): boolean => {
  const env = serverEnv();
  return Boolean(env.SMTP_HOST && env.MAIL_FROM);
};

const getTransporter = (): Transporter => {
  if (transporter) return transporter;
  const env = serverEnv();
  const port = env.SMTP_PORT ?? 587;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE ?? port === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
};

// Only message/code: never the error object, which can embed credentials.
const describeError = (error: unknown): string => {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? `${code}: ${error.message}`.slice(0, 300) : error.message.slice(0, 300);
  }
  return 'unknown error';
};

const messageOnly = (error: unknown): string => (error instanceof Error ? error.message : 'unknown error');

export const sendMail = async (msg: MailMessage): Promise<SendResult> => {
  if (!smtpConfigured()) {
    return { delivered: false, reason: 'smtp_not_configured' };
  }
  try {
    const info = await getTransporter().sendMail({
      from: serverEnv().MAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo,
    });
    return { delivered: true, messageId: String(info.messageId) };
  } catch (error) {
    console.error('[mailer] send failed:', describeError(error));
    return {
      delivered: false,
      reason: 'send_failed',
      error: messageOnly(error),
    };
  }
};

export const verifySmtp = async (): Promise<{ ok: boolean; error?: string }> => {
  if (!smtpConfigured()) return { ok: false, error: 'smtp_not_configured' };
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOnly(error) };
  }
};

export const resetMailerForTests = (transport?: Transporter) => {
  transporter = transport ?? null;
};

export { renderEmail } from '@/server/lib/email/layout';
