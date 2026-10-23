import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '@/server/api/types';
import { buildPagination, ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorOf, can } from '@/server/middleware/auth';
import { rateLimit } from '@/server/middleware/rate-limit';
import { exportAuditCsv, getAuditEntry, getAuditFacets, listAuditEntries } from '@/server/services/audit-service';
import { AuditExportQuery, AuditListQuery } from '@/validations/audit-schema';

// YYYY-MM-DD in Irish time (en-CA formats as ISO).
const irishDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });

const readAudit = can({ audit: ['read'] });

// Activity log. Static paths come before `/:id`.
export const adminAudit = new Hono<AppEnv>()
  .get('/', readAudit, zValidator('query', AuditListQuery), async (c) => {
    const query = c.req.valid('query');
    const { items, total } = await listAuditEntries(query);
    return ok(c, items, { pagination: buildPagination(total, query.page, query.pageSize) });
  })
  .get('/facets', readAudit, async (c) => ok(c, await getAuditFacets()))
  .get('/export.csv', readAudit, rateLimit(10, 60_000), zValidator('query', AuditExportQuery), async (c) => {
    const csv = await exportAuditCsv(actorOf(c), c.req.valid('query'));
    return new Response(csv, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="activity-${irishDay()}.csv"`,
      },
    });
  })
  .get('/:id', readAudit, zValidator('param', z.object({ id: z.uuid() })), async (c) =>
    ok(c, await getAuditEntry(c.req.valid('param').id)),
  );
