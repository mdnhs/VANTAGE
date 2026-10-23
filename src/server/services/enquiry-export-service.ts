import 'server-only';

import { asc, eq, ne } from 'drizzle-orm';

import { hasPermission } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { contactMessages, quoteRequests } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { toCsv } from '@/server/lib/csv';
import { ApiError } from '@/server/lib/errors';
import { SPAM_STATUS } from '@/server/services/retention-service';

export type EnquiryExportType = 'quotes' | 'contacts';

// One file never grows without bound; a final row says when it stopped early.
// Mutable only so a test can lower it.
export const exportLimits = { rows: 10_000 };

const QUOTE_COLUMNS = [
  { key: 'createdAt', label: 'Received' },
  { key: 'status', label: 'Status' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'eircode', label: 'Eircode' },
  { key: 'registration', label: 'Registration' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'year', label: 'Year' },
  { key: 'serviceType', label: 'Service' },
  { key: 'description', label: 'Description' },
  { key: 'estimatedCost', label: 'Estimated cost' },
  { key: 'paymentStatus', label: 'Payment status' },
  { key: 'paidAmount', label: 'Paid amount' },
  { key: 'invoiceNumber', label: 'Invoice number' },
  { key: 'source', label: 'Source' },
];

const CONTACT_COLUMNS = [
  { key: 'createdAt', label: 'Received' },
  { key: 'status', label: 'Status' },
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'service', label: 'Service' },
  { key: 'message', label: 'Message' },
  { key: 'source', label: 'Source' },
];

// YYYY-MM-DD in Irish time (en-CA formats as ISO).
export const irishDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });

// Spam is left out unless that folder is asked for by name.
const statusFilter = (column: typeof quoteRequests.status | typeof contactMessages.status, status?: string) =>
  status && status !== 'all' ? eq(column, status) : ne(column, SPAM_STATUS);

export async function exportCsv(
  actor: Actor,
  type: EnquiryExportType,
  status?: string,
): Promise<{ filename: string; csv: string; count: number; capped: boolean }> {
  const permission = type === 'quotes' ? { quote: ['export' as const] } : { contact: ['export' as const] };
  if (!hasPermission(actor.roles, permission)) throw ApiError.forbidden("You don't have permission to do that");

  const fetched: Record<string, unknown>[] =
    type === 'quotes'
      ? await db
          .select()
          .from(quoteRequests)
          .where(statusFilter(quoteRequests.status, status))
          .orderBy(asc(quoteRequests.createdAt))
          .limit(exportLimits.rows + 1)
      : await db
          .select()
          .from(contactMessages)
          .where(statusFilter(contactMessages.status, status))
          .orderBy(asc(contactMessages.createdAt))
          .limit(exportLimits.rows + 1);

  const capped = fetched.length > exportLimits.rows;
  const rows = capped ? fetched.slice(0, exportLimits.rows) : fetched;
  const csv = toCsv(rows, type === 'quotes' ? QUOTE_COLUMNS : CONTACT_COLUMNS);

  const label = type === 'quotes' ? 'quote' : 'contact';
  await audit(actor, {
    action: `${label}.export`,
    entityType: label,
    summary: `Exported ${rows.length} rows${capped ? ` (capped at ${exportLimits.rows})` : ''}`,
  });
  return { filename: `${type}-${irishDay()}.csv`, csv, count: rows.length, capped };
}
