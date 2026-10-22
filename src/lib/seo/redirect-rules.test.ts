import { describe, expect, it } from 'vitest';

import { RedirectDestination, RedirectInput, RedirectListQuery, RedirectPatch, RedirectSource } from './redirect-rules';

const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message;

describe('RedirectSource', () => {
  it('accepts a site path and strips trailing slashes', () => {
    expect(RedirectSource.parse('/old-page')).toBe('/old-page');
    expect(RedirectSource.parse('/old/')).toBe('/old');
    expect(RedirectSource.parse(' /a/b ')).toBe('/a/b');
  });
  it.each(['/a/../b', '/a/./b', '/./a', '/a/..', '/%2e%2e/a'])('rejects dot segments %j', (v) => {
    expect(RedirectSource.safeParse(v).success).toBe(false);
  });
  it('accepts legacy page sources but not other files', () => {
    for (const v of ['/about.html', '/services.php', '/index.htm', '/page.asp', '/Page.ASPX'])
      expect(RedirectSource.safeParse(v).success, v).toBe(true);
    for (const v of ['/logo.svg', '/robots.txt', '/dashboard/x.html'])
      expect(msg(RedirectSource.safeParse(v)), v).toBe('That address is reserved');
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

describe('RedirectDestination app paths', () => {
  it.each(['/api/v1/x', '/dashboard', '/dashboard/users?x=1', '/login', '/_next/static/a', '/API/x', '/%64ashboard'])(
    'rejects %s',
    (v) => {
      const r = RedirectDestination.safeParse(v);
      expect(r.success).toBe(false);
      expect(r.error?.issues[0]?.message).toBe("That address belongs to the app and can't be a destination");
    },
  );
  it.each(['/services', '/about.html', '/apiary', '/dashboards', '/brochure.pdf', '/uploads/a.pdf', '/assets/x.png'])('allows %s', (v) => {
    expect(RedirectDestination.safeParse(v).success).toBe(true);
  });
});

describe('RedirectDestination canonical form', () => {
  it.each([
    ['/a/../b', '/b'],
    ['/a/./b/', '/a/b'],
    ['/a/', '/a'],
    ['/', '/'],
    ['/a/?x=1', '/a?x=1'],
    ['/../..', '/'],
  ])('%s -> %s', (input, out) => {
    expect(RedirectDestination.parse(input)).toBe(out);
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
