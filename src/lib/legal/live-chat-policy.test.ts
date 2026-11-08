import { describe, expect, it } from 'vitest';

import { tiptapDocSchema, type TiptapDoc } from '@/validations/legal-page-schema';

import { addLiveChatSection } from './live-chat-policy';

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
