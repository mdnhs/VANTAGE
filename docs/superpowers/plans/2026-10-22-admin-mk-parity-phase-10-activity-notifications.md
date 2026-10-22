# Admin MK Parity — Phase 10: Activity Log + Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship MK's Activity log (filters, facets, detail sheet with field diffs, CSV export, Irish time) over Phase 2's `audit_logs`, make every existing VANTAGE admin mutation write to it, and replace the empty topbar bell with MK's derived notifications feed (new quote request, new contact message, enquiry email delivery failure, Meta CAPI failure; 60 s poll; mark-seen) — including MK's `alertOwners` delivery-failure email.

**Architecture:** Port MK (`/Users/nazmulhasansourab/ireland/james-whitfield`) `lib/notifications.ts`, `server/modules/notifications/*`, `admin/modules/notifications/*`, `server/modules/audit/*`, `admin/modules/activity/*`, `server/modules/leads/notify.ts#alertOwners` into VANTAGE layers (`src/lib`, `src/server/{api,services,repositories,lib,middleware}`, `src/features/{notifications,activity}`). As in MK there is **no notifications table**: the feed is derived on read from `quote_requests`, `contact_messages` and system rows in `audit_logs`; read state is `users.notifications_seen_at` (column already exists, migration 0023). System events (delivery failure, CAPI failure) are written through one emitter, `notify(kind, payload)`, which inserts an actor-less audit row.

**Tech Stack:** Hono, Drizzle (`pg`), react-query, nuqs, shadcn (`base-nova` on `@base-ui/react`: Popover, Sheet, Select, Table), nodemailer via `sendMail`/`renderEmail`, vitest (unit + integration projects). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§2 goals 9, 10, 11 "delivery-failure bell item"; §4 anti-goals; §6) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md` (Phase 10 row)

## Global Constraints

- Branch `feat/admin-mk-parity`; each task runs in its own git worktree per the Phase 3 setup (own test DB `vantage_<slot>_test`); stage only the files the task names (`git add <paths>`, never `git add -A`).
- **Runs in parallel with Phases 5, 7, 8, 9** (separate worktrees). Touch shared files only as listed in "Shared files" below, as small additive hunks (append a route mount, append a `REAL_ROUTES` entry, insert one middleware line per route). Never reformat or reorder a shared file.
- Keep every VANTAGE core feature: quote inbox + kanban, contact inbox, manual "New enquiry" dialog, sidebar `badge: 'new-leads'` via `useNewEnquiriesCount` (unchanged, still polls 60 s), topbar Enquiries mail link (already shipped in Phase 3 at `src/components/admin/shell/topbar.tsx:47-57`, matches MK — no change).
- No customer content in audit or notification payloads beyond what MK stores: bell shows enquirer **first name only** (`From Nora`); never quote `description`, contact `message`, email, phone, address, registration, or `adminNotes` text in any audit `summary`/`diff` or notification item. Staff notes changes are recorded as the marker `'[not recorded]'`.
- RBAC exactly MK (no `permissions.ts` change): Activity log + `/admin/audit/*` need `audit.read` (owner, admin). Bell endpoint needs `dashboard.view` (all admin roles); each item kind is filtered by its own permission: `quote` → `quote.read`; `contact` → `contact.read`; `delivery_failed` → `quote.read` or `contact.read` matching the failed enquiry's type; `capi_failed` → `tracking.read`.
- Feed constants (MK): `POLL_MS = 60_000`, `NOTIFICATION_LIMIT = 20`, `NOTIFICATION_WINDOW_DAYS = 30`, badge `9+` above 9. Opening the bell marks seen (`users.notifications_seen_at = now`); a new account's baseline is `users.created_at`. View-as never marks seen (403 `IMPERSONATION_READ_ONLY`, message "Viewing as someone never marks their notifications as read"). Mark-seen is personal UI state: not audited.
- Activity log copy exactly MK: title "Activity log", description "Who changed what, and when. Times are Irish time.", columns When · Who · Action · What · Details ("Changes" when the row has a diff, else "Details"), filters Action ("All actions") · Entity ("All entities") · Person ("Everyone") · From · To, "Export CSV"; dates `en-IE`, `timeZone: 'Europe/Dublin'`; "System" when no actor; impersonated rows show "{real} (viewing as {actor})". Date filters are Irish calendar days, both ends inclusive.
- Audit DTOs never include `ipHash` or `userAgent`.
- Email: alerts go through `sendMail`; with SMTP not configured nothing is sent, nothing throws, and no `delivery_failed` item is created (not-configured is not a failure — the enquiry is visible in the bell anyway).
- `yarn tsc --noEmit`, `yarn lint` (0 errors), `yarn test` green at every task's commit.

## Rulings (made for this plan)

1. **No notifications table, no new migration** — MK derives the feed (`server/modules/notifications/service.ts`) and stores only `users.notifications_seen_at` + index `audit_logs_action_created_idx`; both already exist in VANTAGE (migration `0023_rich_joystick.sql`). `src/server/db/schema/index.ts` is not touched.
2. **`notify(kind, payload)` is the system-event emitter** and writes an actor-less `audit_logs` row; the feed reads those rows by action name. The action strings `'tracking.capi_failed'` and `'enquiry.delivery_failed'` are the contract.
3. **CAPI emitter call belongs to Phase 7** (or Phase 11 if Phase 7 merges first). Phase 10 defines `notify('capi_failed', { status })`, the feed source and its RBAC, and tests them with seeded rows. If Phase 7 lands first writing `audit(null, { action: 'tracking.capi_failed', entityType: 'setting', entityId: 'tracking', … })` directly (MK `capi.ts`), the feed already works; Phase 11 converts that call to `notify()`.
4. **Retention: none for audit logs or notifications** — MK never purges `audit_logs`; the feed has no storage. Existing `retention-service.ts` unchanged. Feed items pointing at a deleted enquiry are dropped at read time.
5. **Audit coverage of existing VANTAGE mutations is done at the route layer** with an `auditRoute(spec)` Hono middleware (one inserted line per route), not inside services, so it does not collide with Phase 5's service/schema rewrites. Audit is written after the handler returns 2xx; an audit insert failure is logged and never fails the already-committed mutation.
6. **Media routes (`admin-media.ts`, `media.ts`) are not instrumented here** — Phase 5 rewrites them. Phase 11 (or Phase 5 if it merges after this phase) adds `auditRoute` with actions `media.upload|update|replace|delete`.
7. **MK's never-wired bell is wired here.** MK ships `NotificationsBell` but its topbar still renders the empty `NotificationsButton`; spec goal 10 requires the live bell. VANTAGE keeps the `NotificationsButton` export name so `topbar.tsx` (edited by Phase 9 for the AI button) is not touched.
8. Staff-entered quotes (`POST /quotes/admin`) appear in the bell like any quote (MK has one lead source; no special case). Spam (`status = 'spam'`, `SPAM_STATUS` from `retention-service.ts`) is excluded.
9. Delivery-failure alert email copy adapted from MK `emails/delivery-failure.tsx`, rendered with VANTAGE `renderEmail`. The new-enquiry email CTA now deep-links the record (`/dashboard/quotes/<id>`, `/dashboard/contacts/<id>`) as MK's `leadUrl` does.
10. MK dashboard "team activity" feed card is out of scope (Phase 11 parity pass); roadmap lists only activity log + bell + mail link.

## Shared files (parallel-phase merge surface)

| File                                                                                                                         | Edit                                                                                                                                                                                                                                                                                                                      | Task |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `src/server/api/index.ts`                                                                                                    | append `.route('/admin/notifications', adminNotifications)` and `.route('/admin/audit', adminAudit)` before `.route('/admin', adminUsersLookup)`; two imports                                                                                                                                                             | 3, 5 |
| `src/lib/admin/coming-soon.ts`                                                                                               | append `'/dashboard/activity'` to `REAL_ROUTES`                                                                                                                                                                                                                                                                           | 6    |
| `src/lib/admin/coming-soon.test.ts`                                                                                          | move `'activity'` from the placeholder list (line 38) to the real-routes list (line 44)                                                                                                                                                                                                                                   | 6    |
| `src/components/admin/shell/notifications-button.tsx`                                                                        | body becomes `<NotificationsBell />`                                                                                                                                                                                                                                                                                      | 4    |
| `src/server/services/enquiry-notify.ts`                                                                                      | delivery-failure notify + owner alert; `Enquiry.id`; deep-link CTA                                                                                                                                                                                                                                                        | 2    |
| `src/server/api/quote-requests.ts`, `src/server/api/contacts.ts`                                                             | one `auditRoute(...)` line on each admin mutation (not the public POST)                                                                                                                                                                                                                                                   | 7    |
| `src/server/api/{services,projects,testimonials,partner-logos,homepage-pillars,homepage-catalogs,homepage-process-steps}.ts` | one `auditRoute(...)` line on each mutation                                                                                                                                                                                                                                                                               | 7    |
| Not touched                                                                                                                  | `src/lib/admin/nav.ts` (Activity entry already `{ audit: ['read'] }`, `dock: true`), `src/lib/admin/route-permissions.ts` (derived from NAV), `src/lib/auth/permissions.ts`, `src/server/db/schema/index.ts`, `src/components/admin/shell/topbar.tsx`, quote/contact **services**, `useNewEnquiriesCount`, `package.json` | —    |

## DB migrations

None (Ruling 1). If a reviewer asks for an actor index, it would be `audit_logs_actor_created_idx` on `(actor_id, created_at DESC)` — not planned; MK has none.

## Task order and concurrency

- Wave A (parallel): **Task 1**, **Task 5**, **Task 7**.
- Wave B (parallel, after Task 1): **Task 2**, **Task 3**. Task 6 after Task 5 may run in this wave too.
- Wave C: **Task 4** (after Task 3).
- Tasks 3 and 5 both append to `src/server/api/index.ts`; whichever merges second rebases (two-line conflict).

## Review Focus

1. A role without enquiry access (marketer, editor, viewer, author) opens the bell → never sees a quote/contact/delivery item, not even a count; intake never sees CAPI. → Task 3 role-matrix test.
2. Customer text leaking through the new surfaces: the bell, the Activity log list/detail/CSV, and the audit diff of a quote/contact edit must not contain surname, email, phone, damage description, message or staff-note text. → Task 3 "first name only" test, Task 7 quote/contact diff test.
3. Owner viewing-as intake opens the bell → intake's unread state unchanged, the UI swallows the 403 (no error toast). → Task 3 view-as test, Task 4 `onError` test.
4. SMTP present but the notification send fails → bell item + owner alert email; the alert itself failing does not throw, loop or write a second row; SMTP absent → no failure item. → Task 2 tests.
5. Activity date filter around DST changes and hand-edited URLs (`?from` after `?to`, `?page=999`, `?pageSize=5000`, junk actor) → correct Irish-day bounds, swapped range, clamped paging, no raw 400. → Task 5 `dublinMidnight` + API tests, Task 6 `toAuditParams` tests.

---

### Task 1: Notification kinds + `notify()` emitter

**Files:**

- Create: `src/lib/notifications.ts`, `src/lib/notifications.test.ts`
- Create: `src/server/lib/notifications/notify.ts`
- Test: `tests/integration/notify.test.ts`

**Interfaces:**

- Produces (`src/lib/notifications.ts`, isomorphic):
  `NOTIFICATION_KINDS = ['quote', 'contact', 'delivery_failed', 'capi_failed'] as const`; `NotificationKind`;
  `NotificationItem = { id: string; kind: NotificationKind; title: string; description: string; href: string; at: string; unread: boolean }`;
  `NotificationsDto = { items: NotificationItem[]; unread: number; seenAt: string }`;
  `POLL_MS = 60_000`, `NOTIFICATION_LIMIT = 20`, `NOTIFICATION_WINDOW_DAYS = 30`; `badgeText(unread: number): string`.
- Produces (`src/server/lib/notifications/notify.ts`, `server-only`):
  `NOTIFY_ACTIONS = { capi_failed: 'tracking.capi_failed', delivery_failed: 'enquiry.delivery_failed' } as const`;
  `type NotifyPayloads = { capi_failed: { status: number | null }; delivery_failed: { enquiry: 'quote' | 'contact'; enquiryId: string; channel: 'notification' | 'auto_reply' } }`;
  `notify<K extends keyof NotifyPayloads>(kind: K, payload: NotifyPayloads[K], dbLike?: DbLike): Promise<void>` — never throws.
- Consumes: `audit(actor, entry, dbLike)` from `src/server/lib/audit.ts`.

Row mapping (actor `null`, `diff` null):

| kind              | action                    | entityType           | entityId    | summary                                                                                          |
| ----------------- | ------------------------- | -------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `capi_failed`     | `tracking.capi_failed`    | `setting`            | `tracking`  | `Meta Conversions API did not accept a Lead event (HTTP 400)` / `(no answer)` when `status` null |
| `delivery_failed` | `enquiry.delivery_failed` | `quote` \| `contact` | `enquiryId` | `The notification to the team failed` / `The auto-reply to the enquirer failed`                  |

- [ ] **Step 1: Write failing tests.** `src/lib/notifications.test.ts`: `badgeText(0) === '0'`, `badgeText(9) === '9'`, `badgeText(10) === '9+'`. `tests/integration/notify.test.ts`: `notify('capi_failed', { status: 400 })` inserts one row matching the table above with `actorId === null`; `{ status: null }` → summary ends `(no answer)`; `notify('delivery_failed', { enquiry: 'contact', enquiryId: id, channel: 'auto_reply' })` → `entityType 'contact'`, `entityId id`, auto-reply summary; with `vi.spyOn` making the insert reject, `notify` resolves and `console.error` is called with `'[notify] failed'` and the kind only.
- [ ] **Step 2:** `yarn vitest run src/lib/notifications.test.ts tests/integration/notify.test.ts` → FAIL (modules missing).
- [ ] **Step 3:** Implement both files per Interfaces.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(notifications): add notification kinds and system notify emitter`.

### Task 2: Delivery-failure notification + owner alert (MK `alertOwners`)

Depends on Task 1.

**Files:**

- Modify: `src/server/services/enquiry-notify.ts`
- Test: `tests/integration/enquiry-notify.test.ts` (extend)

**Interfaces:**

- Consumes: `notify('delivery_failed', …)` (Task 1); `sendMail`, `renderEmail`, `SendResult` (`src/server/lib/email/mailer.ts`); `users` schema.
- Produces: `Enquiry` gains `id: string`; `quoteEnquiry/contactEnquiry` set `adminPath` to `/dashboard/quotes/${row.id}` / `/dashboard/contacts/${row.id}`. `sendEnquiryEmails` signature and `NotifyOutcome` unchanged. Internal `alertOwners(enquiry: Enquiry, channel: 'notification' | 'auto_reply'): Promise<void>`.

Behaviour: after each send, when the result is `{ delivered: false, reason: 'send_failed' }` for a channel → `await notify('delivery_failed', { enquiry: kind, enquiryId: id, channel })` then `await alertOwners(enquiry, channel)`. `alertOwners` mails every user whose `role` contains `owner` and who is not `banned` (MK: `like '%owner%'`; no other role name contains "owner"), skipping when none; subject `Email delivery failed: the new-enquiry notification` / `Email delivery failed: the auto-reply to the visitor`; `renderEmail({ heading: 'Email delivery failed', paragraphs: ['We could not send <label> (at <ISO time>). The enquiry itself is saved. Open it in the admin to follow up.'], cta: { label: 'Open the enquiry', url: appUrl() + adminPath } })`. A failed/rejected alert is `console.error('[enquiry-notify] delivery-failure alert failed')` only — no notify, no retry. Keep the existing `console.error('[enquiry-notify] delivery failed', { kind })`.

- [ ] **Step 1: Write failing tests** (reuse the file's recording transport; make it reject when `subject` starts with `New quote request`):
  - `delivery failure → bell row + owner alert`: owner user exists; `quoteRequestService.create(QUOTE)`; `await settleNotifications()`; one `audit_logs` row `action 'enquiry.delivery_failed'`, `entityType 'quote'`, `entityId row.id`, `actorId null`; `JSON.stringify(row)` contains neither `SECRET-DAMAGE-TEXT` nor `pat@example.com`; a sent mail to the owner with the notification subject above and `text` containing `/dashboard/quotes/${row.id}`.
  - `alert failure never loops`: transport rejects every send; `settleNotifications()` resolves; exactly one `enquiry.delivery_failed` row per failed channel (1 with auto-reply off, 2 with it on).
  - `SMTP not configured → no failure row`: `resetMailerForTests()` with SMTP env unset; create quote; zero `enquiry.delivery_failed` rows.
  - `new-enquiry CTA deep-links`: successful send `text` contains `/dashboard/quotes/${row.id}`; contact → `/dashboard/contacts/${row.id}`.
- [ ] **Step 2:** `yarn vitest run tests/integration/enquiry-notify.test.ts` → new cases FAIL.
- [ ] **Step 3:** Implement per Interfaces.
- [ ] **Step 4:** Same command → all PASS (existing cases too).
- [ ] **Step 5:** Commit `feat(notifications): record enquiry email failures and alert owners`.

### Task 3: Notifications feed API

Depends on Task 1.

**Files:**

- Create: `src/server/services/notifications-service.ts`, `src/server/api/admin-notifications.ts`
- Modify: `src/server/api/index.ts` (shared — mount only)
- Test: `tests/integration/notifications-api.test.ts`

**Interfaces:**

- Consumes: Task 1 constants/types + `NOTIFY_ACTIONS`; `hasPermission(roles, perms)`; `Actor` (`src/server/lib/auth/actor.ts`); `SPAM_STATUS` (`src/server/services/retention-service.ts`); `can`, `actorOf`, `notViewingAs`, `ok`.
- Produces: `listNotifications(actor: Actor, now?: Date): Promise<NotificationsDto>`; `markNotificationsSeen(actor: Actor, now?: Date): Promise<{ seenAt: string }>`; routes `GET /api/v1/admin/notifications` (`can({ dashboard: ['view'] })`) and `POST /api/v1/admin/notifications/seen` (`can({ dashboard: ['view'] })`, `notViewingAs('Viewing as someone never marks their notifications as read')`), both `ok(c, …)`; export `adminNotifications`.

Sources (port MK `service.ts`; `since = now − 30 days`; each source `limit 20`, newest first; merge, sort desc, slice 20; `unread = at > seenAt`; `seenAt = users.notifications_seen_at ?? users.created_at`):

| kind              | from                                                                      | needs                                        | id             | title                          | description               | href                                                              |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------- | -------------- | ------------------------------ | ------------------------- | ----------------------------------------------------------------- |
| `quote`           | `quote_requests` where `status <> 'spam'`                                 | `quote.read`                                 | `quote:<id>`   | `New quote request`            | `From <first name>`       | `/dashboard/quotes/<id>`                                          |
| `contact`         | `contact_messages` where `status <> 'spam'`                               | `contact.read`                               | `contact:<id>` | `New contact message`          | `From <firstName column>` | `/dashboard/contacts/<id>`                                        |
| `delivery_failed` | `audit_logs` action `enquiry.delivery_failed`, `entityType` quote/contact | `quote.read` / `contact.read` per entityType | `audit:<id>`   | `An enquiry email didn't send` | row `summary`             | `/dashboard/quotes/<entityId>` / `/dashboard/contacts/<entityId>` |
| `capi_failed`     | `audit_logs` action `tracking.capi_failed`                                | `tracking.read`                              | `audit:<id>`   | `Meta Conversions API failed`  | row `summary`             | `/dashboard/marketing`                                            |

First name = `name.trim().split(/\s+/)[0] || 'someone'`. `delivery_failed` rows whose enquiry no longer exists are dropped (one `id in (…)` lookup per entity type).

- [ ] **Step 1: Write failing tests** (port MK `tests/integration/api/notifications.test.ts`; seed rows directly; age users with `createdAt = now − 1 day`):
  - role matrix (sorted kinds): intake `['contact','delivery_failed','quote']`; marketer `['capi_failed']`; editor `[]`; viewer `[]`; author `[]`; owner and admin all four.
  - spam quote never listed; `description === 'From Nora'` for `Nora Byrne`; response JSON has no `Byrne`, no email, no description text.
  - new account → items present, `unread 0`.
  - 25 quotes + one 31 days old → 20 items, `unread 20`, newest first.
  - `POST /seen` → 200, then `unread 0`; a quote created after → `unread 1`.
  - View-as (owner viewing intake via `viewAsCookie`) → `GET` shows intake's unread; `POST /seen` → 403 `error.code === 'IMPERSONATION_READ_ONLY'`; intake's own sign-in still sees the same unread.
  - `delivery_failed` audit row for a deleted quote → not listed.
  - signed-out `GET` → 401.
- [ ] **Step 2:** `yarn vitest run tests/integration/notifications-api.test.ts` → FAIL (404).
- [ ] **Step 3:** Implement service + routes; mount in `index.ts`.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(notifications): add role-filtered notifications feed API`.

### Task 4: Notifications bell UI

Depends on Task 3.

**Files:**

- Create: `src/features/notifications/services/api.ts`, `src/features/notifications/utils/query-keys.ts`, `src/features/notifications/hooks/use-notifications.ts`, `src/features/notifications/components/notifications-bell.tsx`
- Modify: `src/components/admin/shell/notifications-button.tsx` (shared — body only, keep export `NotificationsButton`)
- Test: `src/features/notifications/components/notifications-bell.test.tsx`

**Interfaces:**

- Consumes: `GET/POST /admin/notifications[/seen]` (Task 3), `NotificationsDto`, `badgeText`, `POLL_MS` (Task 1); `relativeTime(iso, now)` (`src/components/admin/dashboard/format.ts`); `ICON_BUTTON` (`src/components/admin/shell/constants`).
- Produces: `notificationKeys.all = ['notifications'] as const`; `fetchNotifications(): Promise<NotificationsDto>`; `markNotificationsSeen(): Promise<{ seenAt: string }>` (same `fetch` + `{ success, data }` parse pattern as `src/features/users/services/api.ts`); `useNotifications()` = `useQuery({ queryKey: notificationKeys.all, queryFn, refetchInterval: POLL_MS, refetchIntervalInBackground: false })`; `NotificationsBell({ className?: string })`.

Port MK `admin/modules/notifications/notifications-bell.tsx` verbatim in structure: badge span (`absolute -top-1 -right-1 … bg-primary`) with `badgeText`; trigger `aria-label` `Notifications (<n> unread)` or `Notifications`; on open, remember the ids that were unread as `fresh` (dot + sr-only "(new)") and, only if `unread > 0`, call the seen mutation whose `onSuccess` sets cached data to `unread 0` / all items read and whose `onError` is a no-op (view-as). Items are `next/link` rows (title, muted description, `<time>` with `relativeTime(item.at, dataUpdatedAt)`). Empty copy stays VANTAGE's: "You're all caught up. New enquiries and failed deliveries will show here." Add `ICON_BUTTON` + `relative` to the trigger className.

- [ ] **Step 1: Write failing tests** (mock `fetch`; wrap in a fresh `QueryClientProvider`): 12 unread → badge `9+`, label `Notifications (9+ unread)`; 0 unread → no badge, label `Notifications`; opening with unread → exactly one `POST …/notifications/seen`; opening with 0 unread → none; items render title, description and `href`; seen POST answering 403 → no thrown error, no toast, and the badge keeps its count (cache is only cleared in `onSuccess`, never optimistically); empty list → empty copy.
- [ ] **Step 2:** `yarn vitest run src/features/notifications` → FAIL.
- [ ] **Step 3:** Implement; replace the placeholder body of `NotificationsButton` with `<NotificationsBell />`.
- [ ] **Step 4:** Same command → PASS; `yarn tsc --noEmit`.
- [ ] **Step 5:** Commit `feat(admin): live notifications bell`.

### Task 5: Activity log API (list, facets, detail, CSV export)

Independent (Wave A).

**Files:**

- Create: `src/lib/time/dublin.ts` + `src/lib/time/dublin.test.ts`
- Create: `src/server/lib/csv.ts` + `src/server/lib/csv.test.ts`
- Create: `src/validations/audit-schema.ts`, `src/server/repositories/audit-repository.ts`, `src/server/services/audit-service.ts`, `src/server/api/admin-audit.ts`
- Modify: `src/server/api/index.ts` (shared — mount only)
- Test: `tests/integration/audit-api.test.ts`

**Interfaces:**

- Produces:
  - `dublinMidnight(day: string, offsetDays?: number): Date` — UTC instant of 00:00 Europe/Dublin on `day + offsetDays`, via `Intl.DateTimeFormat` offset lookup (no new dependency).
  - `toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string` — every cell quoted, `"` doubled, Dates ISO, null → empty, formula guard `/^\s*[=+\-@]|^[\t\r]/` → leading `'` (port MK `server/modules/leads/csv.ts`), CRLF line ends.
  - `AuditListQuery` (`page` ≥1 default 1, `pageSize` 1–100 default 20, `actor` string 1–64, `action` ≤64, `entityType` ≤32, `entityId` ≤64, `from`/`to` `z.iso.date()`, refine `from <= to` → message `The end date must be on or after the start date` at path `['to']`); `AuditExportQuery` (filters only, same refine).
  - Repository: `AuditFilters = { actorId?, action?, entityType?, entityId?, from?, to? }`; `listAudit(filters, page, pageSize): Promise<{ items: AuditRowDb[]; total: number }>`; `getAudit(id)`; `exportAudit(filters)` (cap `EXPORT_LIMIT = 10_000`); `auditFacets(): Promise<{ actions: string[]; entityTypes: string[]; actors: { id: string; label: string }[] }>` — port MK `repo.ts` (left-join `users` for `actorName`, alias `impersonator` for `impersonatorName`, `hasDiff`).
  - Service: `listAuditEntries(query)`, `getAuditEntry(id)` (404 `That activity entry no longer exists`), `getAuditFacets()`, `exportAuditCsv(actor, query)` (writes `audit(actor, { action: 'audit.export', entityType: 'audit', summary: 'Exported N activity entries' /* 'entry' when 1 */ })`; columns When, Who (`actorName ?? actorEmail ?? 'System'`), Email, Viewing-as by, Action, Entity, Entity ID, Summary).
  - Routes `adminAudit` mounted at `/admin/audit`, all `can({ audit: ['read'] })`, order `/`, `/facets`, `/export.csv` (`rateLimit(10, 60_000)`; headers `Cache-Control: no-store`, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="activity-YYYY-MM-DD.csv"`), `/:id` (`z.uuid()`). List returns `ok(c, items, { pagination: buildPagination(total, page, pageSize) })`; items carry ISO `createdAt`, never `ipHash`/`userAgent`.

- [ ] **Step 1: Write failing unit tests.** `dublin.test.ts`: `dublinMidnight('2026-01-15')` → `2026-01-15T00:00:00.000Z`; `('2026-07-01')` → `2026-06-30T23:00:00.000Z`; `('2026-03-29')` → `2026-03-29T00:00:00.000Z`; `('2026-03-29', 1)` → `2026-03-29T23:00:00.000Z`; `('2026-10-25')` → `2026-10-24T23:00:00.000Z`; `('2026-10-25', 1)` → `2026-10-26T00:00:00.000Z`; `('2026-12-31', 1)` → `2027-01-01T00:00:00.000Z`. `csv.test.ts`: header row of labels; `=SUM(A1)` → `"'=SUM(A1)"`; `  -1` → `"'  -1"`; `a"b` → `"a""b"`; null → `""`; Date → ISO.
- [ ] **Step 2: Write failing integration tests** (`audit-api.test.ts`): 403 for editor, author, marketer, intake, viewer on all four routes; 200 owner and admin; filter by `action`, `entityType`, `actor`; row at `2026-06-30T23:30:00Z` returned for `from=to=2026-07-01` and not for `to=2026-06-30`; `from > to` → 422 with the refine message; `pageSize=101` → 422; pagination `total`; list/detail JSON has no `ipHash`/`userAgent` keys; detail returns `diff`; unknown uuid → 404; facets lists actions, entity types and `"<name> (<email>)"` actors; export → headers above, first line `"When","Who","Email","Viewing-as by","Action","Entity","Entity ID","Summary"`, a seeded summary `=HYPERLINK(…)` exported with leading `'`, and an `audit.export` row exists afterwards.
- [ ] **Step 3:** `yarn vitest run src/lib/time src/server/lib/csv.test.ts tests/integration/audit-api.test.ts` → FAIL.
- [ ] **Step 4:** Implement; mount in `index.ts`.
- [ ] **Step 5:** Same command → PASS.
- [ ] **Step 6:** Commit `feat(activity): add audit log list, detail, facets and CSV export API`.

### Task 6: Activity log page

Depends on Task 5.

**Files:**

- Create: `src/features/activity/types/index.ts`, `src/features/activity/services/api.ts`, `src/features/activity/utils/{query-keys,params}.ts`, `src/features/activity/utils/params.test.ts`, `src/features/activity/hooks/api/query/{use-audit-list,use-audit-facets,use-audit-entry}.ts`, `src/features/activity/components/{activity-view,activity-detail}.tsx`
- Create: `src/app/(main)/(protected)/(dashboard_layout)/dashboard/activity/{page,loading}.tsx`
- Modify (shared): `src/lib/admin/coming-soon.ts`, `src/lib/admin/coming-soon.test.ts`

**Interfaces:**

- Consumes: Task 5 routes and DTO shapes; `diffRows` (`src/lib/audit/diff.ts`, already ported); `PageHeader`, `SECONDARY_ACTION`, `EmptyState`, skeletons (`src/components/admin/dashboard/*`); `TablePageSkeleton` (`src/components/layout/page-skeleton`); `requirePermission`, `permissionFor` (as `dashboard/users/page.tsx`).
- Produces: `activityParsers` (nuqs client parsers: `page` int default 1, `pageSize` int default 20, `action`, `actor`, `entityType` strings, `from`/`to` `parseAsIsoDate`); `AuditListParams = { page: number; pageSize: number; action?: string; actor?: string; entityType?: string; from?: string; to?: string }`; `toDay(date: Date | null): string | undefined`; `toAuditParams(state): AuditListParams`; `exportHref(params: AuditListParams): string` (`/api/v1/admin/audit/export.csv?…`, filters only); `auditKeys = { all: ['audit'], list: (p) => [...], facets: [...], detail: (id) => [...] }`.

UI: port MK `activity-view.tsx` / `activity-detail.tsx` with VANTAGE pieces — shadcn `Table` (no `@tanstack/react-table`; it is not a dependency) with a Previous/Next pager like `users-table.tsx`; `useQueryStates(activityParsers, { history: 'replace' })`, paging pushes history; filter change resets `page: 1`; `?page` beyond last page → set to last; `keepPreviousData`; facets `staleTime 5 min`; detail `staleTime Infinity`; detail Sheet shows `action · entityType entityId`, "by X, viewing as Y" when impersonated, diff rows before/after (`bg-muted` / `bg-primary/10`), "No field changes were recorded for this entry." when none. `toAuditParams` mirrors MK except actor validity is `/^[A-Za-z0-9_-]{1,64}$/` (VANTAGE user ids are text, not uuid). Page: `metadata { title: 'Activity log', robots noindex }`, `await requirePermission(permissionFor('/dashboard/activity'))`, render `<ActivityView />`.

- [ ] **Step 1: Write failing tests.** `params.test.ts` (port MK `params.test.ts`): page `0`/`-3`/`NaN` → 1; pageSize `0` → 1, `5000` → 100; `from 2026-05-10, to 2026-05-01` → swapped; action of 65 chars dropped; actor `'bad id!'` dropped, `'Abc_123'` kept; Invalid Date / year 275760 → undefined; `exportHref` omits `page`/`pageSize`, keeps filters, no `?` when empty. `coming-soon.test.ts`: `'activity'` now in the excluded-real-routes list, removed from placeholders.
- [ ] **Step 2:** `yarn vitest run src/features/activity src/lib/admin/coming-soon.test.ts` → FAIL.
- [ ] **Step 3:** Implement feature files + page; append `'/dashboard/activity'` to `REAL_ROUTES`.
- [ ] **Step 4:** Same command → PASS; `yarn tsc --noEmit`; `yarn lint`.
- [ ] **Step 5:** Commit `feat(activity): add activity log page`.

### Task 7: Audit every existing VANTAGE admin mutation

Independent (Wave A).

**Files:**

- Create: `src/server/middleware/audit-route.ts`, `src/server/middleware/audit-route.test.ts` (unit: diff + source coverage)
- Modify (shared, one line per route): `src/server/api/{quote-requests,contacts,services,projects,testimonials,partner-logos,homepage-pillars,homepage-catalogs,homepage-process-steps}.ts`
- Test: `tests/integration/audit-coverage.test.ts`

**Interfaces:**

- Consumes: `audit()`, `topLevelDiff(before, after)` (`src/lib/audit/top-level-diff.ts`), `AppEnv`.
- Produces:
  - `REDACTED = '[not recorded]'`
  - `type AuditRouteSpec = { action: string; entityType: string; summary: string; load?: (id: string) => Promise<object | null | undefined>; fields?: readonly string[]; redact?: readonly string[] }`
  - `auditDiff(before: object | null | undefined, after: object | null | undefined, opts: { fields?: readonly string[]; redact?: readonly string[] }): Record<string, { from: unknown; to: unknown }> | null` — `topLevelDiff` over the allowlist (default: every key except `id`, `createdAt`, `updatedAt`), redacted keys' values replaced by `REDACTED`, `null` when empty.
  - `auditRoute(spec: AuditRouteSpec)` — Hono middleware placed right after `can(...)`. Before `next()`: if `spec.load` and `c.req.param('id')`, load `before`. After: only when `c.res.status` is 2xx; `entityId = param id ?? (await c.res.clone().json()).data?.id`; `diff = spec.load ? auditDiff(before, responseData, spec) : null`; when `spec.load` is set and `diff` is null, skip (no-op edit, as MK); `audit(c.get('actor'), { action, entityType, entityId, summary, diff })`; a throwing `audit` → `console.error('[audit-route] failed', spec.action)` and the response is returned unchanged.

Route map (`<Label>` = Quote request, Contact message, Service, Project, Testimonial, Partner logo, Homepage pillar, Homepage catalog, Homepage process step; entity types `quote, contact, service, project, testimonial, partner_logo, homepage_pillar, homepage_catalog, homepage_process_step`):

| Route                                     | action           | summary              | load / fields                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /` (content) · `POST /quotes/admin` | `<type>.create`  | `<Label> created`    | none (create carries no diff; quotes never)                                                                                                                                                                                                                                                |
| `PATCH /:id` · `PATCH /:id/status`        | `<type>.update`  | `<Label> updated`    | `load: <svc>.byId`; quote `fields: ['status','assignedUserId','inspectionDate','estimatedCost','paymentStatus','paidAmount','paymentMethod','invoiceNumber','completedAt','adminNotes']`, contact `fields: ['status','adminNotes']`, both `redact: ['adminNotes']`; content default fields |
| `PATCH /reorder`                          | `<type>.reorder` | `<Label>s reordered` | none                                                                                                                                                                                                                                                                                       |
| `DELETE /:id`                             | `<type>.delete`  | `<Label> deleted`    | none                                                                                                                                                                                                                                                                                       |

The public `POST /quotes` and `POST /contacts` are **not** audited (visitor submissions; no actor). Media routes excluded (Ruling 6).

- [ ] **Step 1: Write failing unit tests** (`audit-route.test.ts`): `auditDiff({a:1,b:2,updatedAt:x},{a:1,b:3,updatedAt:y},{})` → `{ b: { from: 2, to: 3 } }`; `fields` excludes non-listed keys; `redact: ['adminNotes']` → `{ adminNotes: { from: '[not recorded]', to: '[not recorded]' } }`; identical → `null`. Coverage scan: for each file in the route map, every `.post(` / `.patch(` / `.put(` / `.delete(` chain segment containing `can({` contains `auditRoute(` — fails today.
- [ ] **Step 2: Write failing integration tests** (`audit-coverage.test.ts`): owner PATCHes a quote `{ status: 'contacted', adminNotes: 'NOTE-TEXT' }` → one `quote.update` row, `diff.status = { from: 'new', to: 'contacted' }`, `diff.adminNotes` redacted, `JSON.stringify(row)` contains none of `NOTE-TEXT`, the description, email, phone; PATCH with no change → no row; contact DELETE → `contact.delete` with `entityId`; service PATCH title → `service.update` with `diff.title`; service reorder → `service.reorder`, `diff null`; staff `POST /quotes/admin` → `quote.create`, `diff null`; a 404 PATCH and a 422 PATCH → no row; `vi.spyOn` `audit` to throw → PATCH still 200; row `actorId` = signed-in user, `impersonatedBy` set under View-as.
- [ ] **Step 3:** `yarn vitest run src/server/middleware/audit-route.test.ts tests/integration/audit-coverage.test.ts` → FAIL.
- [ ] **Step 4:** Implement middleware; insert one `auditRoute({...})` line per route in the map.
- [ ] **Step 5:** Same command → PASS; full `yarn test` (existing route tests unaffected).
- [ ] **Step 6:** Commit `feat(activity): audit quote, contact and website content mutations`.

### Phase exit check

- [ ] `yarn tsc --noEmit`, `yarn lint` 0 errors, `yarn test` green, `yarn build` OK.
- [ ] Controller browser check (dev, demo users): owner — bell shows a fresh quote and contact, badge clears on open, item links open the record; submit a quote with SMTP pointed at a dead host → "An enquiry email didn't send" appears; intake — no CAPI items, no Activity log in the dock; marketer — no enquiry items; owner viewing-as intake — bell opens without error and intake's unread survives; Activity log — edit a quote and a service, see both rows, open "Changes", filter by Person/Action/dates, Export CSV downloads; sidebar Enquiries badge and topbar mail link unchanged; quote kanban + contact inbox unchanged.
