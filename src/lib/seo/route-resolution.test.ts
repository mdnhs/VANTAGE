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

describe('resolvePath with the published legal pages', () => {
  const legal = new Set(['privacy-policy']);

  it('passes a published legal page', () => {
    expect(resolvePath(table, '/privacy-policy', legal)).toEqual({ kind: 'pass' });
  });
  it('marks any other single-segment address missing', () => {
    expect(resolvePath(table, '/nope', legal)).toEqual({ kind: 'missing' });
    expect(resolvePath(table, '/constructor', legal)).toEqual({ kind: 'missing' });
  });
  it('still redirects a table hit first', () => {
    expect(resolvePath(table, '/old', legal)).toEqual({ kind: 'redirect', destination: '/services', statusCode: 301 });
  });
  it('leaves deeper paths and live pages to the app', () => {
    expect(resolvePath(table, '/a/b', legal)).toEqual({ kind: 'pass' });
    expect(resolvePath(table, '/services', legal)).toEqual({ kind: 'pass' });
  });
  it('fails open when the legal list is unknown', () => {
    expect(resolvePath(table, '/nope', null)).toEqual({ kind: 'pass' });
  });
});
