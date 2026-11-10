import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { services } from '@/server/db/schema';
import { supportKnowledgeRepository } from '@/server/repositories/support-knowledge-repository';
import { settleNotifications } from '@/server/services/enquiry-notify';
import { supportKnowledgeService } from '@/server/services/support-knowledge-service';

import { call, createTestUser, signInCookie } from '../support/session';

const actor = (userId: string) => ({
  userId,
  email: 'o@x.test',
  name: 'Owner',
  roles: ['owner' as const],
  twoFactorEnabled: false,
  sessionId: 's',
  impersonatedBy: null,
  ip: null,
  userAgent: null,
});

const addService = (name: string, description: string, startingPrice: number | null = null) =>
  db.insert(services).values({
    name,
    slug: `${name.toLowerCase().replace(/\W+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`,
    description,
    startingPrice,
  });

const syncNow = async (userId: string) => {
  await supportKnowledgeService.start(actor(userId));
  await settleNotifications();
};

beforeEach(async () => {
  await db.execute(sql`truncate table support_knowledge, support_knowledge_sync, services cascade`);
});

describe('support knowledge', () => {
  it('has no memory before the first sync, so the bot reads live content', async () => {
    expect(await supportKnowledgeService.contextFor('how much is a dent repair?')).toBeNull();
    const status = await supportKnowledgeService.status();
    expect(status).toMatchObject({ status: 'idle', stale: true, lastSyncedAt: null });
  });

  it('a sync copies the website into memory and reports progress to the end', async () => {
    const { id } = await createTestUser('owner');
    await addService('Dent Repair', 'Zorblax dent removal for parking dings', 95);
    await addService('Alloy Wheel Refurbishment', 'Diamond-cut resurfacing and kerb rash repair', 85);
    await syncNow(id);

    const status = await supportKnowledgeService.status();
    expect(status).toMatchObject({ status: 'done', done: status.total, error: null, stale: false });
    expect(status.lastSyncedAt).not.toBeNull();
    expect(status.chunks).toBeGreaterThanOrEqual(3);
  });

  it('returns the pieces that match the question, plus the business details', async () => {
    const { id } = await createTestUser('owner');
    await addService('Dent Repair', 'Zorblax dent removal for parking dings', 95);
    await addService('Alloy Wheel Refurbishment', 'Diamond-cut resurfacing and kerb rash repair', 85);
    await syncNow(id);

    const text = (await supportKnowledgeService.contextFor('Do you repair alloy wheels?')) ?? '';
    expect(text).toContain('Business, contact and opening hours');
    expect(text).toContain('Alloy Wheel Refurbishment (from €85)');
    // "repair" also matches the dent service, but the alloy service ranks first.
    expect(text.indexOf('Alloy Wheel Refurbishment')).toBeLessThan(text.indexOf('Zorblax'));
  });

  it('falls back to the service list when nothing matches the question', async () => {
    const { id } = await createTestUser('owner');
    await addService('Dent Repair', 'Paintless dent removal', 95);
    await syncNow(id);
    const text = (await supportKnowledgeService.contextFor('hello can you help me?')) ?? '';
    expect(text).toContain('Dent Repair (from €95)');
  });

  it('drops content that was removed from the site on the next sync', async () => {
    const { id } = await createTestUser('owner');
    await addService('Dent Repair', 'Paintless dent removal', 95);
    await syncNow(id);
    expect(await supportKnowledgeRepository.ofSource('service', 10)).toHaveLength(1);
    await db.execute(sql`truncate table services cascade`);
    await syncNow(id);
    expect(await supportKnowledgeRepository.ofSource('service', 10)).toHaveLength(0);
  });

  it('marks the memory out of date when a service changes after the sync', async () => {
    const { id } = await createTestUser('owner');
    await addService('Dent Repair', 'Paintless dent removal', 95);
    await syncNow(id);
    expect((await supportKnowledgeService.status()).stale).toBe(false);
    await db.execute(sql`update services set updated_at = now() + interval '1 minute'`);
    expect((await supportKnowledgeService.status()).stale).toBe(true);
  });

  it('refuses a second sync while one is running', async () => {
    const { id } = await createTestUser('owner');
    expect(await supportKnowledgeRepository.tryStart(6, id)).not.toBeNull();
    await expect(supportKnowledgeService.start(actor(id))).rejects.toMatchObject({ status: 409 });
  });

  it('lets only settings editors read and run the sync through the API', async () => {
    const owner = await createTestUser('owner');
    const ownerCookie = await signInCookie(owner.email);
    const agent = await createTestUser('support');
    const agentCookie = await signInCookie(agent.email);

    expect((await call('/admin/support/knowledge', agentCookie)).status).toBe(403);
    expect((await call('/admin/support/knowledge/sync', agentCookie, { method: 'POST' })).status).toBe(403);
    expect((await call('/admin/support/knowledge', ownerCookie)).status).toBe(200);
    const started = await call('/admin/support/knowledge/sync', ownerCookie, { method: 'POST' });
    expect(started.status).toBe(202);
    await settleNotifications();
  });
});
