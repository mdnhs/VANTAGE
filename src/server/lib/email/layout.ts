export type EmailContent = {
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Returns the normalized url only when it is an absolute http(s) url. */
const safeHttpUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
};

export const renderEmail = ({ heading, paragraphs, cta }: EmailContent): { html: string; text: string } => {
  const ctaUrl = cta ? safeHttpUrl(cta.url) : null;

  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">${escapeHtml(p)}</p>`)
    .join('');
  const button =
    cta && ctaUrl
      ? `<p style="margin:24px 0;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 24px;background:#111111;color:#ffffff;text-decoration:none;border-radius:4px;font-size:15px;">${escapeHtml(cta.label)}</a></p>`
      : '';

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;"><div style="max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:6px;"><h1 style="margin:0 0 24px;font-size:22px;color:#111111;">${escapeHtml(heading)}</h1>${body}${button}</div></body></html>`;

  const text = [heading, ...paragraphs, ...(cta && ctaUrl ? [`${cta.label}: ${ctaUrl}`] : [])].join('\n\n');

  return { html, text };
};
