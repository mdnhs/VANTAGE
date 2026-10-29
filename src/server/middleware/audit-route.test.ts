import { readdirSync, readFileSync } from 'node:fs';
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

// Every admin mutation is refused during View-as. This scans EVERY file in src/server/api: a guarded
// write (post/put/patch/delete behind `can(`, `canGlobal(` or `signedIn`) must carry `notViewingAs(`,
// directly or through a file-level alias (`const viewing = notViewingAs(...)`).
const API_DIR = path.join(process.cwd(), 'src/server/api');
const API_FILES = readdirSync(API_DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
const GUARD = /\b(?:can|canGlobal)\(|\bsignedIn\b/;
// Deliberate exceptions, "file METHOD path-prefix". Nothing is allowlisted today: account self-service
// is refused during View-as too (it belongs to the person, not to an admin viewing as them).
const VIEW_AS_ALLOWLIST: string[] = [];

const mutations = (source: string) =>
  source
    .split(/\n {2}\.(?=(?:get|post|patch|put|delete)\()|(?<=new Hono<AppEnv>\(\))\.(?=(?:get|post|patch|put|delete)\()/)
    .slice(1)
    .filter((s) => /^(?:post|patch|put|delete)\(/.test(s));

describe('View-as coverage of every admin route file', () => {
  it('finds the route files', () => {
    expect(API_FILES.length).toBeGreaterThan(20);
  });

  it.each(API_FILES)('every guarded mutation in %s is refused during View-as', (file) => {
    const source = readFileSync(path.join(API_DIR, file), 'utf8');
    const aliases = [...source.matchAll(/^const (\w+) = notViewingAs\(/gm)].map((m) => m[1]!);
    for (const segment of mutations(source).filter((s) => GUARD.test(s))) {
      const head = segment.replace(/\s+/g, ' ').slice(0, 60);
      if (VIEW_AS_ALLOWLIST.includes(`${file} ${head.split(/[(,]/)[0]}`)) continue;
      const covered = segment.includes('notViewingAs(') || aliases.some((a) => new RegExp(`\\b${a}\\b`).test(segment));
      expect(covered, `${file}: ${head}`).toBe(true);
    }
  });
});

const ROUTE_FILES = [
  'quote-requests',
  'contacts',
  'services',
  'projects',
  'testimonials',
  'partner-logos',
  'homepage-catalogs',
  'homepage-process-steps',
];

describe('route coverage', () => {
  it.each(ROUTE_FILES)('every guarded mutation in %s is audited', (file) => {
    const source = readFileSync(path.join(API_DIR, `${file}.ts`), 'utf8');
    const guarded = mutations(source).filter((s) => s.includes('can({'));
    expect(guarded.length).toBeGreaterThan(0);
    for (const segment of guarded) {
      expect(segment, segment.slice(0, 60)).toContain('auditRoute(');
      expect(segment, segment.slice(0, 60)).toContain('notViewingAs(');
    }
  });

  it('every audited delete confirms the record exists first', () => {
    for (const file of ROUTE_FILES) {
      const source = readFileSync(path.join(API_DIR, `${file}.ts`), 'utf8');
      for (const segment of mutations(source).filter((s) => s.startsWith('delete('))) {
        expect(segment, `${file} delete`).toMatch(/load:\s*\w+\.byId/);
      }
    }
  });
});
