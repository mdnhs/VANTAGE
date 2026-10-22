import 'server-only';

import { and, desc, eq, gt, inArray, ne } from 'drizzle-orm';

import { hasPermission } from '@/lib/auth/permissions';
import {
  NOTIFICATION_LIMIT,
  NOTIFICATION_WINDOW_DAYS,
  type NotificationItem,
  type NotificationsDto,
} from '@/lib/notifications';
import { db } from '@/server/db';
import { auditLogs, contactMessages, quoteRequests, users } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { NOTIFY_ACTIONS } from '@/server/lib/notifications/notify';
import { SPAM_STATUS } from '@/server/services/retention-service';

const DAY_MS = 86_400_000;

// First name only: surname, email and enquiry text never reach the bell.
const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'someone';

async function seenAtOf(userId: string): Promise<Date> {
  const [row] = await db
    .select({ seenAt: users.notificationsSeenAt, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.seenAt ?? row?.createdAt ?? new Date(0);
}

// The feed is derived on read (no notifications table): enquiries plus system rows in audit_logs.
export async function listNotifications(actor: Actor, now: Date = new Date()): Promise<NotificationsDto> {
  const seenAt = await seenAtOf(actor.userId);
  const since = new Date(now.getTime() - NOTIFICATION_WINDOW_DAYS * DAY_MS);
  const canQuote = hasPermission(actor.roles, { quote: ['read'] });
  const canContact = hasPermission(actor.roles, { contact: ['read'] });
  const canTracking = hasPermission(actor.roles, { tracking: ['read'] });
  const items: Omit<NotificationItem, 'unread'>[] = [];

  if (canQuote) {
    const rows = await db
      .select({ id: quoteRequests.id, name: quoteRequests.name, createdAt: quoteRequests.createdAt })
      .from(quoteRequests)
      .where(and(gt(quoteRequests.createdAt, since), ne(quoteRequests.status, SPAM_STATUS)))
      .orderBy(desc(quoteRequests.createdAt))
      .limit(NOTIFICATION_LIMIT);
    for (const r of rows) {
      items.push({
        id: `quote:${r.id}`,
        kind: 'quote',
        title: 'New quote request',
        description: `From ${firstName(r.name)}`,
        href: `/dashboard/quotes/${r.id}`,
        at: r.createdAt.toISOString(),
      });
    }
  }

  if (canContact) {
    const rows = await db
      .select({ id: contactMessages.id, firstName: contactMessages.firstName, createdAt: contactMessages.createdAt })
      .from(contactMessages)
      .where(and(gt(contactMessages.createdAt, since), ne(contactMessages.status, SPAM_STATUS)))
      .orderBy(desc(contactMessages.createdAt))
      .limit(NOTIFICATION_LIMIT);
    for (const r of rows) {
      items.push({
        id: `contact:${r.id}`,
        kind: 'contact',
        title: 'New contact message',
        description: `From ${firstName(r.firstName)}`,
        href: `/dashboard/contacts/${r.id}`,
        at: r.createdAt.toISOString(),
      });
    }
  }

  if (canQuote || canContact) {
    const allowed = [...(canQuote ? ['quote'] : []), ...(canContact ? ['contact'] : [])];
    const rows = await db
      .select({
        id: auditLogs.id,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        summary: auditLogs.summary,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, NOTIFY_ACTIONS.delivery_failed),
          inArray(auditLogs.entityType, allowed),
          gt(auditLogs.createdAt, since),
        ),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(NOTIFICATION_LIMIT);
    // Drop rows whose enquiry has since been deleted: one lookup per entity type.
    const ids = (type: string) => rows.filter((r) => r.entityType === type && r.entityId).map((r) => r.entityId!);
    const quoteIds = ids('quote');
    const contactIds = ids('contact');
    const [liveQuotes, liveContacts] = await Promise.all([
      quoteIds.length
        ? db.select({ id: quoteRequests.id }).from(quoteRequests).where(inArray(quoteRequests.id, quoteIds))
        : [],
      contactIds.length
        ? db.select({ id: contactMessages.id }).from(contactMessages).where(inArray(contactMessages.id, contactIds))
        : [],
    ]);
    const live = new Set([...liveQuotes, ...liveContacts].map((r) => r.id));
    for (const r of rows) {
      if (!r.entityId || !live.has(r.entityId)) continue;
      items.push({
        id: `audit:${r.id}`,
        kind: 'delivery_failed',
        title: "An enquiry email didn't send",
        description: r.summary,
        href: `/dashboard/${r.entityType === 'quote' ? 'quotes' : 'contacts'}/${r.entityId}`,
        at: r.createdAt.toISOString(),
      });
    }
  }

  if (canTracking) {
    const rows = await db
      .select({ id: auditLogs.id, summary: auditLogs.summary, createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(and(eq(auditLogs.action, NOTIFY_ACTIONS.capi_failed), gt(auditLogs.createdAt, since)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(NOTIFICATION_LIMIT);
    for (const r of rows) {
      items.push({
        id: `audit:${r.id}`,
        kind: 'capi_failed',
        title: 'Meta Conversions API failed',
        description: r.summary,
        href: '/dashboard/marketing',
        at: r.createdAt.toISOString(),
      });
    }
  }

  const merged = items
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, NOTIFICATION_LIMIT)
    .map((i) => ({ ...i, unread: new Date(i.at) > seenAt }));
  return { items: merged, unread: merged.filter((i) => i.unread).length, seenAt: seenAt.toISOString() };
}

export async function markNotificationsSeen(actor: Actor, now: Date = new Date()): Promise<{ seenAt: string }> {
  await db.update(users).set({ notificationsSeenAt: now }).where(eq(users.id, actor.userId));
  return { seenAt: now.toISOString() };
}
