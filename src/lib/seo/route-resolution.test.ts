import { describe, expect, it } from 'vitest';

import { resolvePath, type RedirectTable } from './route-resolution';

const table: RedirectTable = {
  '/old': { destination: '/services', statusCode: 301 },
  '/services': { destination: '/elsewhere', statusCode: 302 },
};

describe('resolvePath', () => {
  it('lets a live path pass even when the table has it', () => {
    expect(resolvePath(table, '/services')).toEqual({ kind: 'pass' });
  });
  it('redirects a table hit', () => {
    expect(resolvePath(table, '/old')).toEqual({ kind: 'redirect', destination: '/services', statusCode: 301 });
  });
  it('passes a miss, including inherited object keys', () => {
    expect(resolvePath(table, '/nope')).toEqual({ kind: 'pass' });
    expect(resolvePath(table, '/constructor')).toEqual({ kind: 'pass' });
  });
});
