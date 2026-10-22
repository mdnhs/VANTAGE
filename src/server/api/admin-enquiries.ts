import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '@/server/api/types';
import { zValidator } from '@/server/lib/validator';
import { actorOf, can, canAny } from '@/server/middleware/auth';
import { rateLimit } from '@/server/middleware/rate-limit';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import { ok } from '@/server/lib/response';
import { exportCsv, irishDay } from '@/server/services/enquiry-export-service';
import { erasePerson, exportPerson } from '@/server/services/enquiry-privacy-service';

const exportQuery = z.object({
  type: z.enum(['quotes', 'contacts']),
  status: z.string().trim().max(40).optional(),
});
const personQuery = z.object({ email: z.string().trim().toLowerCase().pipe(z.email().max(255)) });

const NO_STORE = { 'Cache-Control': 'no-store' };

// CSV export and privacy requests for the two enquiry inboxes. The export permission depends on
// `type`, so the service checks it; the guard only requires some export right.
export const adminEnquiries = new Hono<AppEnv>()
  .get(
    '/export.csv',
    canAny({ quote: ['export'] }, { contact: ['export'] }),
    rateLimit(10, 60_000),
    zValidator('query', exportQuery),
    async (c) => {
      const { type, status } = c.req.valid('query');
      const { filename, csv } = await exportCsv(actorOf(c), type, status);
      return new Response(csv, {
        headers: {
          ...NO_STORE,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    },
  )
  .get(
    '/privacy',
    can({ quote: ['export'], contact: ['export'] }),
    rateLimit(10, 60_000),
    zValidator('query', personQuery),
    async (c) => {
      const data = await exportPerson(actorOf(c), c.req.valid('query').email);
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          ...NO_STORE,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="privacy-${irishDay()}.json"`,
        },
      });
    },
  )
  .delete(
    '/privacy',
    can({ quote: ['delete'], contact: ['delete'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    rateLimit(10, 60_000),
    zValidator('query', personQuery),
    async (c) => ok(c, await erasePerson(actorOf(c), c.req.valid('query').email)),
  );
