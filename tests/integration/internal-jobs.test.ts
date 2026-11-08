import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { supportService } from '@/server/services/support-service';

import { call } from '../support/session';

const KEY = process.env.AUTH_SECRET!;
const run = (key?: string, query = '') =>
  call(`/internal/jobs/retention${query}`, undefined, { method: 'POST', headers: key ? { 'x-job-key': key } : {} });

const chats = async () => {
  const { rows } = await db.execute(sql`select count(*)::int as n from support_conversations`);
  return (rows[0] as { n: number }).n;
};

async function oldChat() {
  const { conversation } = await supportService.start({ body: 'Old chat' });
  await db.execute(
    sql`update support_conversations set last_message_at = now() - interval '10 years' where id = ${conversation.id}`,
  );
}

beforeEach(async () => {
  await db.execute(sql`truncate table settings, support_conversations cascade`);
});

describe('POST /internal/jobs/retention', () => {
  it('pretends not to exist without the key', async () => {
    await oldChat();

    expect((await run()).status).toBe(404);
    expect((await run('wrong-key')).status).toBe(404);
    expect(await chats()).toBe(1);
  });

  it('only counts on a dry run', async () => {
    await oldChat();

    const res = await run(KEY, '?dryRun=1');

    expect(res.status).toBe(200);
    expect((await res.json()).data.chats).toBe(1);
    expect(await chats()).toBe(1);
  });

  it('removes what has passed the retention window', async () => {
    await oldChat();
    await supportService.start({ body: 'Recent chat' });

    const res = await run(KEY);

    expect((await res.json()).data.chats).toBe(1);
    expect(await chats()).toBe(1);
  });
});
