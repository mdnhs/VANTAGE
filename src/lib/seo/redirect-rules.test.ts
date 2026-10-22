import { describe, expect, it } from 'vitest';

import { RedirectDestination, RedirectInput, RedirectListQuery, RedirectPatch, RedirectSource } from './redirect-rules';

const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message;

describe('RedirectSource', () => {
  it('accepts a site path and strips trailing slashes', () => {
    expect(RedirectSource.parse('/old-page')).toBe('/old-page');
    expect(RedirectSource.parse('/old/')).toBe('/old');
    expect(RedirectSource.parse(' /a/b ')).toBe('/a/b');
  });
  it.each(['//evil', '/\\evil', 'old', '/a b', '/a?x=1', ''])('rejects %j', (v) => {
    expect(RedirectSource.safeParse(v).success).toBe(false);
  });
  it('rejects the home page, live pages and reserved paths', () => {
    expect(msg(RedirectSource.safeParse('/'))).toBe("The home page can't redirect");
    expect(msg(RedirectSource.safeParse('/services'))).toBe('That address is a live page');
    for (const p of ['/dashboard/x', '/api/x', '/login', '/robots.txt'])
      expect(msg(RedirectSource.safeParse(p))).toBe('That address is reserved');
  });
});

describe('RedirectDestination', () => {
  it.each(['/services', '/services?ref=old', '/a/b'])('accepts %s', (v) => {
    expect(RedirectDestination.safeParse(v).success).toBe(true);
  });
  it.each(['https://evil.com', '//evil.com', '/\t/evil', '/\\evil', '/a#x', 'services'])('rejects %j', (v) => {
    expect(RedirectDestination.safeParse(v).success).toBe(false);
  });
});

describe('RedirectInput / Patch / ListQuery', () => {
  it('defaults status and note, and bounds the note', () => {
    expect(RedirectInput.parse({ sourcePath: '/old', destination: '/new' })).toEqual({
      sourcePath: '/old',
      destination: '/new',
      statusCode: 301,
      note: '',
    });
    expect(RedirectInput.safeParse({ sourcePath: '/old', destination: '/new', note: 'x'.repeat(201) }).success).toBe(false);
    expect(RedirectInput.safeParse({ sourcePath: '/old', destination: '/new', statusCode: 200 }).success).toBe(false);
  });
  it('patch is strict and needs a key', () => {
    expect(msg(RedirectPatch.safeParse({}))).toBe('Nothing to change');
    expect(RedirectPatch.safeParse({ sourcePath: '/x' }).success).toBe(false);
    expect(RedirectPatch.parse({ isActive: false })).toEqual({ isActive: false });
  });
  it('list query defaults and caps', () => {
    expect(RedirectListQuery.parse({})).toEqual({ page: 1, limit: 25 });
    expect(RedirectListQuery.safeParse({ limit: '101' }).success).toBe(false);
  });
});
