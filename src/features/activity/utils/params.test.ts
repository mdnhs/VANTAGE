import { describe, expect, it } from 'vitest';

import { exportHref, toAuditParams, toDay } from './params';

const base = { page: 1, pageSize: 20, action: null, actor: null, entityType: null, from: null, to: null };

describe('toAuditParams', () => {
  it('maps URL state to the API query, dropping empty filters', () => {
    expect(toAuditParams({ ...base, page: 2, action: 'auth.sign_in', from: new Date('2026-10-05T00:00:00Z') })).toEqual(
      {
        page: 2,
        pageSize: 20,
        action: 'auth.sign_in',
        actor: undefined,
        entityType: undefined,
        from: '2026-10-05',
        to: undefined,
      },
    );
  });

  it('keeps paging inside the API limits', () => {
    expect(toAuditParams({ ...base, page: 0 }).page).toBe(1);
    expect(toAuditParams({ ...base, page: -3 }).page).toBe(1);
    expect(toAuditParams({ ...base, page: Number.NaN }).page).toBe(1);
    expect(toAuditParams({ ...base, pageSize: 0 }).pageSize).toBe(20);
    expect(toAuditParams({ ...base, pageSize: -5 }).pageSize).toBe(1);
    expect(toAuditParams({ ...base, pageSize: 5000 }).pageSize).toBe(100);
  });

  it('swaps a range that ends before it starts', () => {
    const params = toAuditParams({
      ...base,
      from: new Date('2026-05-10T00:00:00Z'),
      to: new Date('2026-05-01T00:00:00Z'),
    });
    expect(params).toMatchObject({ from: '2026-05-01', to: '2026-05-10' });
  });

  it('drops an over-long action, a bad actor and an over-long entity type', () => {
    const params = toAuditParams({ ...base, action: 'x'.repeat(65), actor: 'bad id!', entityType: 'y'.repeat(33) });
    expect(params.action).toBeUndefined();
    expect(params.actor).toBeUndefined();
    expect(params.entityType).toBeUndefined();
  });

  it('keeps a text user id as the actor', () => {
    expect(toAuditParams({ ...base, actor: 'Abc_123' }).actor).toBe('Abc_123');
  });
});

describe('toDay', () => {
  it('treats Invalid Date, huge years and out-of-window years as no day', () => {
    expect(toDay(new Date('275760-01-01'))).toBeUndefined();
    expect(toDay(new Date(Number.NaN))).toBeUndefined();
    expect(toDay(new Date('+275760-09-13T00:00:00Z'))).toBeUndefined();
    expect(toDay(new Date('1850-01-01T00:00:00Z'))).toBeUndefined();
    expect(toDay(null)).toBeUndefined();
    expect(toDay(new Date('2026-05-10T00:00:00Z'))).toBe('2026-05-10');
  });
});

describe('exportHref', () => {
  it('carries the filters, not the paging', () => {
    const href = exportHref({ page: 3, pageSize: 50, action: 'page.publish', entityType: 'page', from: '2026-01-01' });
    expect(href).toMatch(/\/admin\/audit\/export\.csv\?action=page\.publish&entityType=page&from=2026-01-01$/);
    expect(href).not.toMatch(/page=|pageSize/);
  });
  it('has no query string when there are no filters', () => {
    expect(exportHref({ page: 1, pageSize: 20 })).toMatch(/\/admin\/audit\/export\.csv$/);
  });
});
