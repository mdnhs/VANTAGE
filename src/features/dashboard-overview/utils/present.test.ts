import { describe, expect, it } from 'vitest';

import type { DashboardDto } from '../types';
import { actionStatus, dashboardGreeting, firstName, greetingFor, kpisFor, setupSteps } from './present';

describe('greetingFor (Irish time)', () => {
  it.each([
    ['2026-10-08T23:00:00Z', 'Good morning'], // 00:00 IST
    ['2026-10-08T22:59:00Z', 'Good evening'], // 23:59 IST, the day before
    ['2026-10-09T10:59:00Z', 'Good morning'], // 11:59 IST
    ['2026-10-09T11:00:00Z', 'Good afternoon'], // 12:00 IST
    ['2026-10-09T16:59:00Z', 'Good afternoon'], // 17:59 IST
    ['2026-10-09T17:00:00Z', 'Good evening'], // 18:00 IST
    ['2026-12-09T11:30:00Z', 'Good morning'], // 11:30 GMT
    ['2026-12-09T12:00:00Z', 'Good afternoon'], // 12:00 GMT
    ['2026-12-09T18:00:00Z', 'Good evening'], // 18:00 GMT
  ])('%s -> %s', (iso, expected) => {
    expect(greetingFor(new Date(iso))).toBe(expected);
  });
});

describe('dashboardGreeting', () => {
  const evening = '2026-10-09T19:00:00Z';
  const morning = '2026-10-09T08:00:00Z';

  it("goes by the dashboard answer's time once it has arrived", () => {
    expect(dashboardGreeting('Sam', morning, evening)).toBe('Good morning, Sam');
  });

  it("goes by the page's render time until then", () => {
    expect(dashboardGreeting('Sam', undefined, evening)).toBe('Good evening, Sam');
  });
});

describe('firstName', () => {
  it.each([
    ['Sam Shell', 'Sam'],
    ['  Magda  ', 'Magda'],
    ['', 'there'],
  ])('%j -> %j', (name, expected) => {
    expect(firstName(name)).toBe(expected);
  });
});

describe('actionStatus', () => {
  it('labels known audit actions', () => {
    expect(actionStatus('auth.sign_in')).toEqual({ label: 'Signed in', tone: 'success' });
    expect(actionStatus('user.invite')).toEqual({ label: 'Invited', tone: 'info' });
    expect(actionStatus('something.else')).toBeUndefined();
  });
});

const base = {
  generatedAt: '2026-10-09T10:00:00.000Z',
  enquiries: { value: 0, previous: 0 },
  enquiriesWeek: { days: [], current: 0, previous: 0 },
  seoHealth: null,
  contentHealth: null,
  recentActivity: null,
  nextUp: [],
  pipeline: null,
} satisfies DashboardDto;

describe('kpisFor', () => {
  it('captions zeros honestly and links only where the viewer may go', () => {
    const kpis = kpisFor({ ...base, seoHealth: { score: 100, issues: 0 } }, () => false);
    expect(kpis.map((k) => [k.label, k.value, k.caption, k.href])).toEqual([
      ['New enquiries', '0', 'last 30 days', undefined],
      ['SEO health', '100%', 'nothing to fix', undefined],
    ]);
  });

  it('compares enquiries, adds SEO health and links for an owner', () => {
    const kpis = kpisFor(
      { ...base, enquiries: { value: 12, previous: 8 }, seoHealth: { score: 92, issues: 1 } },
      () => true,
    );
    expect(kpis[0]).toMatchObject({ caption: 'vs the 30 days before', href: '/dashboard/quotes', variant: 'hero' });
    expect(kpis[1]).toMatchObject({
      label: 'SEO health',
      value: '92%',
      caption: '1 issue to fix',
      href: '/dashboard/seo',
    });
  });

  it('links contact-only viewers to the contacts inbox', () => {
    const kpis = kpisFor(base, (p) => Boolean(p.contact));
    expect(kpis[0]?.href).toBe('/dashboard/contacts');
  });

  it('leaves out the cards whose data the role does not get', () => {
    expect(kpisFor({ ...base, enquiries: null }, () => true)).toEqual([]);
  });
});

describe('setupSteps', () => {
  it('keeps only the two setup steps for the checklist', () => {
    const step = (id: DashboardDto['nextUp'][number]['id']) => ({
      id,
      title: id,
      description: '',
      cta: '',
      href: '',
      done: false,
    });
    expect(setupSteps([step('enquiry'), step('two-factor'), step('invite')]).map((s) => s.id)).toEqual([
      'two-factor',
      'invite',
    ]);
  });
});
