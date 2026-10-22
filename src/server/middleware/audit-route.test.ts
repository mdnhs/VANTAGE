import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { auditDiff, REDACTED } from './audit-route';

describe('auditDiff', () => {
  it('diffs top-level keys and ignores id and timestamps', () => {
    expect(auditDiff({ a: 1, b: 2, updatedAt: 'x' }, { a: 1, b: 3, updatedAt: 'y' }, {})).toEqual({
      b: { from: 2, to: 3 },
    });
  });

  it('limits the comparison to the allowlist', () => {
    expect(auditDiff({ a: 1, b: 2 }, { a: 9, b: 3 }, { fields: ['b'] })).toEqual({ b: { from: 2, to: 3 } });
  });

  it('records that a redacted key changed without its values', () => {
    expect(auditDiff({ adminNotes: 'old' }, { adminNotes: 'NOTE-TEXT' }, { redact: ['adminNotes'] })).toEqual({
      adminNotes: { from: REDACTED, to: REDACTED },
    });
    expect(REDACTED).toBe('[not recorded]');
  });

  it('is null when nothing changed', () => {
    expect(auditDiff({ a: 1 }, { a: 1 }, {})).toBeNull();
    expect(auditDiff({ a: 1, adminNotes: 'x' }, { a: 1, adminNotes: 'x' }, { redact: ['adminNotes'] })).toBeNull();
  });
});

const ROUTE_FILES = [
  'quote-requests',
  'contacts',
  'services',
  'projects',
  'testimonials',
  'partner-logos',
  'homepage-pillars',
  'homepage-catalogs',
  'homepage-process-steps',
];

describe('route coverage', () => {
  it.each(ROUTE_FILES)('every guarded mutation in %s is audited', (file) => {
    const source = readFileSync(path.join(process.cwd(), 'src/server/api', `${file}.ts`), 'utf8');
    const segments = source.split(/\n {2}\.(?=(?:get|post|patch|put|delete)\()/).slice(1);
    const guarded = segments.filter((s) => /^(?:post|patch|put|delete)\(/.test(s) && s.includes('can({'));
    expect(guarded.length).toBeGreaterThan(0);
    for (const segment of guarded) {
      expect(segment, segment.slice(0, 60)).toContain('auditRoute(');
    }
  });
});
