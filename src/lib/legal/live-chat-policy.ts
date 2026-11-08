import type { TiptapDoc, TiptapNode } from '@/validations/legal-page-schema';

const textOf = (node: TiptapNode) => (node.content ?? []).map((child) => child.text ?? '').join('');
const isHeading = (node: TiptapNode) => node.type === 'heading';
const paragraph = (text: string): TiptapNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });

function withUpdatedDate(node: TiptapNode, date: string): TiptapNode {
  if (node.type !== 'paragraph' || !node.content) return node;
  const at = node.content.findIndex((child) => child.text?.startsWith('Last Updated:'));
  if (at === -1) return node;
  const content = node.content.map((child) => ({ ...child }));
  const label = content[at]!;
  // The label may hold the date itself, or (when the label is bold) leave it to the next piece.
  if (label.text!.trim() === 'Last Updated:' && content[at + 1]?.text !== undefined) {
    content[at + 1]!.text = ` ${date}`;
  } else {
    label.text = `Last Updated: ${date}`;
  }
  return { ...node, content };
}

// Adds what the website's live chat collects to a privacy policy, after the "Information We
// Collect" subsections. Safe to run twice: a policy that already covers it is returned as it was.
export function addLiveChatSection(
  doc: TiptapDoc,
  { retentionMonths, today }: { retentionMonths: number; today: Date },
): { doc: TiptapDoc; changed: boolean } {
  if (doc.content.some((node) => isHeading(node) && textOf(node).includes('Live Chat'))) {
    return { doc, changed: false };
  }

  const next = doc.content.findIndex((node) => isHeading(node) && textOf(node).startsWith('4. '));
  const numbered = next !== -1;
  const level = numbered ? doc.content[next]!.attrs?.level : doc.content.find(isHeading)?.attrs?.level;
  const section: TiptapNode[] = [
    {
      type: 'heading',
      attrs: { level: level ?? 3 },
      content: [{ type: 'text', text: `${numbered ? '3.4 ' : ''}Live Chat` }],
    },
    paragraph(
      'If you use the chat button on our website, we collect the messages you send, the page you started the chat from and, if you choose to give them, your name and email address. Our team reads these messages so that we can answer your enquiry.',
    ),
    paragraph(
      `We keep a chat for up to ${retentionMonths} months after its last message and then delete it. You can ask us to delete it sooner using the contact details in this policy.`,
    ),
    paragraph(
      'When you start a chat we set one strictly necessary cookie, support_chat, so that the website can recognise your conversation. It lasts 30 days and is not used for analytics or marketing.',
    ),
  ];

  const at = numbered ? next : doc.content.length;
  const date = today.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Dublin',
  });
  const content = [...doc.content.slice(0, at), ...section, ...doc.content.slice(at)].map((node) =>
    withUpdatedDate(node, date),
  );
  return { doc: { ...doc, content }, changed: true };
}

const PLACEHOLDERS = {
  '[Insert Business Email Address]': 'email',
  '[Insert Business Address]': 'address',
} as const;

// Puts the published business details where the policy template left blanks.
export function fillBusinessDetails(
  doc: TiptapDoc,
  details: { email: string; address: string },
): { doc: TiptapDoc; changed: boolean } {
  let changed = false;
  const fill = (node: TiptapNode): TiptapNode => {
    let text = node.text;
    for (const [placeholder, field] of Object.entries(PLACEHOLDERS)) {
      if (text?.includes(placeholder)) {
        text = text.replaceAll(placeholder, details[field]);
        changed = true;
      }
    }
    return {
      ...node,
      ...(text === undefined ? {} : { text }),
      ...(node.content ? { content: node.content.map(fill) } : {}),
    };
  };
  const content = doc.content.map(fill);
  return changed ? { doc: { ...doc, content }, changed } : { doc, changed };
}
