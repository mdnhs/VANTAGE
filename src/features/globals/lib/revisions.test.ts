import { describe, expect, it } from 'vitest';

import type { GlobalRevision } from '../types';
import { newestFirst, revisionSummary } from './revisions';

const rev = (version: number, extra: Partial<GlobalRevision> = {}): GlobalRevision => ({
  id: `r${version}`,
  version,
  note: null,
  createdAt: '2026-10-22T10:00:00.000Z',
  createdBy: 'u1',
  createdByName: 'Alex',
  ...extra,
});

describe('newestFirst', () => {
  it('orders versions newest first without mutating the input', () => {
    const input = [rev(1), rev(3), rev(2)];
    expect(newestFirst(input).map((r) => r.version)).toEqual([3, 2, 1]);
    expect(input.map((r) => r.version)).toEqual([1, 3, 2]);
  });
});

describe('revisionSummary', () => {
  const now = Date.parse('2026-10-22T12:00:00.000Z');
  it('reads "Version N · who · when"', () => {
    expect(revisionSummary(rev(4), now)).toBe('Version 4 · Alex · 2 hours ago');
  });
  it('names an unknown author "Someone"', () => {
    expect(revisionSummary(rev(1, { createdByName: null }), now)).toMatch(/^Version 1 · Someone · /);
  });
});
