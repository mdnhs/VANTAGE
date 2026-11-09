import { describe, expect, it } from 'vitest';

import { tiptapDocSchema, type TiptapDoc } from '@/validations/legal-page-schema';

import { addAiAssistantNotice, addLiveChatSection, fillBusinessDetails } from './live-chat-policy';

const text = (value: string) => ({ type: 'text', text: value });
const heading = (value: string, level = 3) => ({ type: 'heading', attrs: { level }, content: [text(value)] });
const paragraph = (...values: string[]) => ({ type: 'paragraph', content: values.map(text) });
const titles = (doc: TiptapDoc) => doc.content.filter((n) => n.type === 'heading').map((n) => n.content?.[0]?.text);
const allText = (doc: TiptapDoc) => JSON.stringify(doc);

const policy = (): TiptapDoc => ({
  type: 'doc',
  content: [
    heading('Privacy Policy', 2),
    paragraph('Last Updated: 2 November 2026'),
    heading('3. Information We Collect'),
    heading('3.3 Information Related to Vehicle Repair Services'),
    paragraph('Vehicle details.'),
    heading('4. How We Use Your Personal Information'),
    paragraph('To reply to you.'),
  ],
});

const OPTIONS = { retentionMonths: 24, today: new Date('2026-11-08T12:00:00Z') };

describe('addLiveChatSection', () => {
  it('adds the section at the end of "Information We Collect"', () => {
    expect(titles(addLiveChatSection(policy(), OPTIONS).doc)).toEqual([
      'Privacy Policy',
      '3. Information We Collect',
      '3.3 Information Related to Vehicle Repair Services',
      '3.4 Live Chat',
      '4. How We Use Your Personal Information',
    ]);
  });

  it('uses the heading size of the surrounding sections', () => {
    const { doc } = addLiveChatSection(policy(), OPTIONS);
    expect(doc.content.find((n) => n.content?.[0]?.text === '3.4 Live Chat')?.attrs?.level).toBe(3);
  });

  it('states what is collected, the cookie and the retention period', () => {
    const out = allText(addLiveChatSection(policy(), { ...OPTIONS, retentionMonths: 12 }).doc);
    expect(out).toContain('12 months');
    expect(out).toContain('support_chat');
    expect(out).toContain('30 days');
    expect(out).toMatch(/email address/);
  });

  it('updates the visible "Last Updated" line', () => {
    const out = allText(addLiveChatSection(policy(), OPTIONS).doc);
    expect(out).toContain('Last Updated: 8 November 2026');
    expect(out).not.toContain('2 November 2026');
  });

  it('updates a "Last Updated" line split into a bold label and a date', () => {
    const doc = policy();
    doc.content[1] = paragraph('Last Updated:', ' 2 November 2026');
    expect(allText(addLiveChatSection(doc, OPTIONS).doc)).toContain(
      '"Last Updated:"},{"type":"text","text":" 8 November 2026"',
    );
  });

  it('updates a "Last Updated" line that sits among other lines of a paragraph', () => {
    const doc = policy();
    doc.content[1] = {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Website: https://example.com' },
        { type: 'hardBreak' },
        { type: 'text', text: 'Last Updated:' },
        { type: 'text', text: ' 2 November 2026' },
      ],
    };

    const out = allText(addLiveChatSection(doc, OPTIONS).doc);

    expect(out).toContain('"Last Updated:"},{"type":"text","text":" 8 November 2026"');
    expect(out).toContain('Website: https://example.com');
  });

  it('leaves a sentence that merely mentions the date alone', () => {
    const doc = policy();
    doc.content.push(paragraph('Updates are published with a revised "Last Updated" date.'));

    expect(allText(addLiveChatSection(doc, OPTIONS).doc)).toContain('a revised \\"Last Updated\\" date.');
  });

  it('changes nothing the second time', () => {
    const once = addLiveChatSection(policy(), OPTIONS);
    const twice = addLiveChatSection(once.doc, { ...OPTIONS, today: new Date('2027-01-01T12:00:00Z') });
    expect(twice.changed).toBe(false);
    expect(twice.doc).toEqual(once.doc);
  });

  it('adds the section at the end of a policy without numbered sections', () => {
    const doc: TiptapDoc = { type: 'doc', content: [heading('Test', 2), paragraph('test description')] };
    const out = addLiveChatSection(doc, OPTIONS);
    expect(titles(out.doc)).toEqual(['Test', 'Live Chat']);
    expect(out.changed).toBe(true);
  });

  it('produces a document the legal page editor accepts', () => {
    expect(tiptapDocSchema.safeParse(addLiveChatSection(policy(), OPTIONS).doc).success).toBe(true);
  });

  it('leaves the original document untouched', () => {
    const doc = policy();
    const before = JSON.stringify(doc);
    addLiveChatSection(doc, OPTIONS);
    expect(JSON.stringify(doc)).toBe(before);
  });
});

describe('fillBusinessDetails', () => {
  const details = { email: 'shop@example.com', address: '10 Park Street, Dublin' };
  const withPlaceholders = (): TiptapDoc => ({
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [paragraph('Email: [Insert Business Email Address]')] },
          { type: 'listItem', content: [paragraph('Business Address: [Insert Business Address]')] },
        ],
      },
      paragraph('Write to [Insert Business Email Address] at any time.'),
    ],
  });

  it('fills every placeholder, however deep', () => {
    const { doc, changed } = fillBusinessDetails(withPlaceholders(), details);

    expect(changed).toBe(true);
    expect(allText(doc)).not.toContain('[Insert');
    expect(allText(doc)).toContain('Email: shop@example.com');
    expect(allText(doc)).toContain('Business Address: 10 Park Street, Dublin');
    expect(allText(doc)).toContain('Write to shop@example.com at any time.');
  });

  it('reports no change when there is nothing to fill', () => {
    const before = policy();

    const { doc, changed } = fillBusinessDetails(before, details);

    expect(changed).toBe(false);
    expect(doc).toEqual(before);
  });

  it('leaves the original document untouched', () => {
    const before = withPlaceholders();
    const copy = JSON.stringify(before);

    fillBusinessDetails(before, details);

    expect(JSON.stringify(before)).toBe(copy);
  });
});

describe('addAiAssistantNotice', () => {
  const withChat = () => addLiveChatSection(policy(), OPTIONS).doc;

  it('says an AI answers first, that the text goes to an AI provider and that a person can take over', () => {
    const out = allText(addAiAssistantNotice(withChat(), OPTIONS).doc);
    expect(out).toMatch(/automated AI assistant/);
    expect(out).toMatch(/AI provider/);
    expect(out).toMatch(/team member can take over/);
  });

  it('puts the notice inside the Live Chat section, before the next section', () => {
    const { doc } = addAiAssistantNotice(withChat(), OPTIONS);
    const titleAt = (t: string) => doc.content.findIndex((n) => n.content?.[0]?.text === t);
    const noticeAt = doc.content.findIndex((n) => allText({ ...doc, content: [n] }).includes('automated AI assistant'));
    expect(noticeAt).toBeGreaterThan(titleAt('3.4 Live Chat'));
    expect(noticeAt).toBeLessThan(titleAt('4. How We Use Your Personal Information'));
  });

  it('is safe to run twice', () => {
    const once = addAiAssistantNotice(withChat(), OPTIONS);
    const twice = addAiAssistantNotice(once.doc, OPTIONS);
    expect(once.changed).toBe(true);
    expect(twice.changed).toBe(false);
    expect(twice.doc).toEqual(once.doc);
  });

  it('does nothing to a policy with no Live Chat section', () => {
    const result = addAiAssistantNotice(policy(), OPTIONS);
    expect(result.changed).toBe(false);
    expect(result.doc).toEqual(policy());
  });

  it('updates the visible "Last Updated" line and stays a valid document', () => {
    const { doc } = addAiAssistantNotice(withChat(), { ...OPTIONS, today: new Date('2026-12-01T12:00:00Z') });
    expect(allText(doc)).toContain('Last Updated: 1 December 2026');
    expect(tiptapDocSchema.safeParse(doc).success).toBe(true);
  });
});
