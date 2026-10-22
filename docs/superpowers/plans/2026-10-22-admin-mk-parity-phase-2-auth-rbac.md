# Admin MK Parity — Phase 2: Auth + RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move VANTAGE admin accounts onto Better Auth with MK's admin + twoFactor setup and MK's 7-role access control (extended with VANTAGE resources), add the audit log, migrate existing admins without forcing password resets, guard every API route and dashboard page with the role matrix, and ship MK-style auth screens plus a Users & roles screen.

**Architecture:** Port MK (`/Users/nazmulhasansourab/ireland/james-whitfield`) `server/auth/*`, `lib/auth/*`, `server/lib/audit.ts`, `server/modules/users/*`, `server/api/middleware/{auth,view-as,actor-limit}.ts` and `admin/modules/{auth,users}/*` into VANTAGE's layout (`src/server/lib/auth/*`, `src/lib/auth/*`, `src/server/api/*`, `src/server/services/*`, `src/server/repositories/*`, `src/features/{auth,users}/*`). Keep VANTAGE's existing `users` table (text ids) and add MK's columns. The custom `vantage_session` JWT, `src/lib/permission/*`, the `/api/v1/admins` API and `features/admin-users` are retired at the end of the phase; the `admin_users` table stays (read-only, for rollback) until Phase 11.

**Tech Stack:** better-auth 1.7.7 (MK pin) with `admin`, `twoFactor` plugins; Hono; Drizzle + pg; bcryptjs (existing hashes); vitest; react-hook-form + zod; shadcn base-nova.

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§2 goals 2–3, §5.3, §5.4, §5.6a) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md`

## Global Constraints

- Branch `feat/admin-mk-parity`; stage only files your task names; never `git add -A`. Read `node_modules/next/dist/docs/` before Next APIs. yarn v1; pin MK's exact versions.
- Roles exactly MK's: `owner, admin, editor, author, marketer, intake, viewer` (+ non-admin `user` for site customers, never allowed into `/dashboard`). `defaultRole: 'user'`; `adminRoles: ['owner', 'admin']`.
- Statement = MK statement **minus** `article`, `collection`, `newsletter`, `lead`, **plus** `page: [read, update]` (website page copy), `content: [read, create, update, delete]` (services, projects, testimonials, partner logos, pillars, catalog, process steps), `quote: [read, update, export, delete]`, `contact: [read, update, export, delete]`. Role grants for the new resources: owner/admin all; editor `page[read,update] content[*]`; author `page[read] content[read,create,update]` (projects only own — enforced later, Phase 11 note); marketer `page[read] content[read]` no quote/contact; intake `quote[read,update] contact[read,update]`; viewer `page[read] content[read]`.
- 2FA as MK: TOTP + backup codes only (no email OTP), optional for every role, recommended for owner/admin; issuer `VANTAGE Admin`.
- Email (invite / reset) via `sendMail` from `src/server/lib/email/mailer.ts`. When `smtpConfigured()` is false the API response that triggered it returns `{ manualLink: <url> }` so the UI can show a copyable link; never log links.
- Existing admin passwords (bcrypt `$2a$/$2b$`) keep working: Better Auth `emailAndPassword.password.verify` falls back to bcrypt for bcrypt hashes; new hashes use Better Auth's default.
- Sessions: 7 days, updateAge 1 day, cookie cache 300 s, admin API reads fresh session (`disableCookieCache`) as MK; cookie prefix `vantage`.
- Rate limits as MK (`/sign-in/email` 5/60s, `/request-password-reset` 3/300s, `/two-factor/*` 5/60s, `/change-password` 5/300s, `/reset-password` 5/300s), database storage, disabled when `NODE_ENV=test` or development.
- Never print secrets, tokens, reset links or passwords in logs, reports or chat. Demo user passwords live only in `src/server/db/seed-demo-users.ts` defaults / `.env.example` comments.
- Audit every admin mutation that this phase touches (users, roles, bans, invites, sign-in, password change, 2FA, impersonation) via `audit()`.

## Review Focus

1. A site customer (role `user`) with a valid Better Auth session hits `/dashboard` or any `/api/v1/admin/*` → redirected to `/login` / 403, never in. → Task 5 + Task 7 tests.
2. Removing or demoting the last active owner (role change, ban, delete — including self) → 409 `LAST_OWNER`, nothing changes. → Task 6 test.
3. An existing admin signs in with their old password after migration → succeeds, and their access matches their old permissions. → Task 4 test.
4. A viewer/intake calls a write endpoint they lack (e.g. intake → `PATCH /services/:id`, marketer → `GET /quotes/admin/list`) → 403, no side effect. → Task 5 tests (table-driven over the matrix).
5. During View-as (impersonation) any write to users/password/2FA → refused `IMPERSONATION_READ_ONLY`; session ends after 1 h. → Task 6 test.

---

### Task 1: Schema for Better Auth admin/2FA, rate limits, audit log

**Files:** Modify `src/server/db/schema/auth.ts`, `src/server/db/schema/quote-requests.ts`, `src/server/db/schema/relations.ts`, `src/server/db/schema/index.ts`; Create `src/server/db/schema/audit.ts`, `src/server/db/schema/rate-limits.ts`; migration via `yarn db:generate`; `package.json` (`better-auth` → 1.7.7, `@better-auth/cli` only if MK uses it — check).

**Interfaces — Produces:**

- `users` + `role text not null default 'user'`, `banned boolean default false`, `ban_reason text`, `ban_expires timestamptz`, `two_factor_enabled boolean default false`, `notifications_seen_at timestamptz`.
- `sessions` + `impersonated_by text`.
- `two_factors` (`id text pk`, `secret text`, `backup_codes text`, `user_id text fk users cascade`, plus any columns better-auth 1.7.7 twoFactor requires — mirror MK `twoFactors`).
- `rate_limits` (`id text pk`, `key text unique`, `count integer`, `last_request bigint`) — mirror MK.
- `audit_logs` exactly MK columns/indexes with `actor_id text`/`impersonated_by text` FK → `users.id` on delete set null.
- `quote_requests.assigned_user_id text` FK → `users.id` on delete set null + index; existing `assigned_admin_id` untouched (dropped in Phase 11). Relations: `quoteRequests.assignedUser`.

- [ ] Step 1: Write `tests/integration/auth-schema.test.ts`: inserting a user defaults `role = 'user'`; `audit_logs` row with `actor_id` = a users id; deleting the user sets `actor_id` null; `quote_requests.assigned_user_id` set-null on user delete.
- [ ] Step 2: Run → FAIL. Step 3: implement schema + migration (review SQL: only additive changes). Step 4: PASS; `yarn db:migrate` on dev.
- [ ] Step 5: Commit `feat(db): add Better Auth admin, 2FA, rate-limit and audit tables`.

### Task 2: Permission statement, roles and helpers

**Files:** Create `src/lib/auth/permissions.ts`, `src/lib/auth/permissions.test.ts`, `src/lib/auth/role-labels.ts`, `src/lib/auth/matrix.ts`, `src/lib/auth/matrix.test.ts`, `src/lib/auth/me.ts`. Source: MK `lib/auth/{permissions,role-labels,matrix,me}.ts`.

**Interfaces — Produces:** `statement`, `ac`, `roles`, `ROLE_NAMES` (7 admin roles, ordered owner→viewer), `type RoleName`, `type Resource`, `type Permissions`, `parseRoles(value: string | null | undefined): RoleName[]` (trims; unknown/`user` dropped), `hasPermission(roles: RoleName[], perms: Permissions): boolean`, `permissionMap(roles)`, `isAdminRole(roles: RoleName[]): boolean` (non-empty), `ROLE_LABELS`, `ROLE_PURPOSE`, `permissionMatrix(): MatrixRow[]`, `toMePayload(...)`, `type MePayload`.

- [ ] Step 1: Tests: table-driven over every role × resource × action asserting the exact grants in Global Constraints and MK (owner all incl. `code.update`, `user.impersonate-admins`; admin no `code`, no `impersonate-admins`; editor/author/marketer/intake/viewer as MK for shared resources + the VANTAGE grants above); `parseRoles(' editor, user ,x')` → `['editor']`; `hasPermission([], …)` false.
- [ ] Steps 2–4: RED, implement, GREEN. Step 5: commit `feat(auth): add MK role matrix with VANTAGE resources`.

### Task 3: Better Auth server config, audit writer, auth plugins

**Files:** Create `src/server/lib/auth/{auth,hooks,sign-in-audit,account-hooks,two-factor-policy,response-scrub,email,actor,fresh-session,session,view-as-limit,password}.ts`, `src/server/lib/audit.ts`, `src/lib/audit/diff.ts` (+ tests); Modify `src/server/lib/auth.ts` (re-export `getAuth`/`auth` for existing imports), `src/app/api/auth/[...all]/route.ts`, `src/lib/auth-client.ts` (`adminClient({ac, roles})`, `twoFactorClient()`), `tests/test-env.mjs` (no new secret needed — Better Auth uses `AUTH_SECRET`).
Source: MK `server/auth/*`, `server/lib/audit.ts`, `lib/audit/diff.ts`, `admin/lib/auth-client.ts`.

**Interfaces — Produces:**

- `getAuth()`, `resetAuthForTests()`; config per Global Constraints; `appName 'VANTAGE Admin'`; `disableSignUp: true` for admins — the legacy customer `/api/v1/users` create keeps working through `auth.api.createUser` with role `user`.
- `password.ts`: `verifyPassword({hash, password})` → bcrypt when hash starts with `$2`, else Better Auth default `verifyPassword`.
- `audit(actor: AuditActor | null, entry: AuditEntry, db?: DbLike): Promise<void>`; `diffRows(diff)`.
- `type Actor` (MK), `toActor(session, headers)`, `getFreshSession(headers)`, `isBanned(user)`.
- `server-only` page helpers in `session.ts`: `getSession()`, `requireActor(next?)` → redirect `/login?next=…`, `requirePermission(perms, next?)` → redirect `/unauthorized` (existing page); both also redirect role-`user` sessions to `/login`.
- `email.ts`: `deliverAuthEmail(user, url): Promise<{ manualLink?: string }>` — invite vs reset by `invite=1` in callback; when SMTP missing returns `{ manualLink: url }`; request-scoped capture so the users API (Task 6) can return it.

- [ ] Step 1: Integration tests `tests/integration/auth.test.ts`: create user via `auth.api.createUser` + sign in (`auth.api.signInEmail`) → session; bcrypt-hashed credential (insert account with `bcryptjs.hashSync('Correct-horse-1', 12)`) signs in; wrong password fails; banned user → `getFreshSession` null; `audit()` writes row with ip hashed (not raw) and diff; response scrub removes `token` from JSON; sign-in writes `auth.sign_in` audit.
- [ ] Steps 2–4: RED, implement, GREEN. Step 5: commit `feat(auth): configure Better Auth admin + 2FA with audit trail`.

### Task 4: Admin migration, owner bootstrap and demo users

**Files:** Create `scripts/migrate-admin-users.ts` (`yarn auth:migrate-admins [--dry-run|--verify]`), `src/server/services/user-bootstrap-service.ts` (`createOwner`, `provisionUser`), `scripts/admin-create.ts` (`yarn admin:create --email --name`), `src/server/db/seed-demo-users.ts` (`yarn db:seed-demo`, runs only when `SEED_DEMO_USERS=true`), `tests/integration/migrate-admin-users.test.ts`, `tests/integration/demo-users.test.ts`; Modify `package.json`, `.env.example` (demo comment: passwords documented as `Demo-<Role>-2026!`).

**Interfaces — Produces:**

- Migration: for each `admin_users` row → `users` row with **same id as text** (`id::text`), email, name, `email_verified true`, `banned = !is_active`, role mapping: has `user_management.admin.manage` (or `role = 'admin'` with it) → `owner`; content.* + leads.* → `admin`; only content.* → `editor`; only leads.* → `intake`; nothing → `viewer`; if no owner results, the oldest active admin becomes `owner`. Matching `accounts` row (`provider_id 'credential'`, `account_id = user id`, `password = password_hash`). Then `quote_requests.assigned_user_id = assigned_admin_id::text`. Idempotent (skip existing emails), one transaction, `--dry-run` prints planned counts + role mapping per email (no hashes), `--verify` checks counts/roles/FK copy and exits non-zero on mismatch.
- `createOwner({ email, name }): Promise<{ manualLink?: string }>` (MK bootstrap; audits `user.bootstrap-owner`).
- Demo users (MK style, one per role): `owner@vantage.test` "Olivia Owner", `admin@vantage.test` "Adam Admin", `editor@vantage.test` "Erin Editor", `author@vantage.test` "Aaron Author", `marketer@vantage.test` "Maya Marketer", `intake@vantage.test` "Ian Intake", `viewer@vantage.test` "Vera Viewer"; password `Demo-<Role>-2026!` (e.g. `Demo-Owner-2026!`); idempotent.

- [ ] Step 1: Tests: migration maps sample admins (owner/editor/intake/inactive→banned), old bcrypt password signs in afterwards (Review Focus 3), `--verify` passes, re-run is a no-op; assigned_user_id copied; demo seed refuses without `SEED_DEMO_USERS=true`, creates 7 users with right roles, idempotent.
- [ ] Steps 2–4: RED, implement, GREEN. Run `yarn auth:migrate-admins --dry-run` then real run on **dev** DB and `--verify`; run demo seed on dev with `SEED_DEMO_USERS=true`.
- [ ] Step 5: Commit `feat(auth): migrate admin accounts and add owner/demo seeding`.

### Task 5: API guards on the role matrix

**Files:** Create `src/server/middleware/session.ts` (`session`, `signedIn`, `can`), `src/server/middleware/view-as.ts` (`notViewingAs`), `src/server/middleware/actor-limit.ts`; Modify every Hono router using `requireAuth`/`requirePermission` (`site-settings, services, projects, testimonials, partner-logos, homepage-pillars, homepage-catalogs, homepage-process-steps, quote-requests, contacts, admin-media, media, users, auth`), `src/server/repositories/quote-request-repository.ts` + quote service/validation (assignee → `assignedUserId`, relation `assignedUser {id,name,email}`), `src/server/api/index.ts`; Create `src/server/api/admin-users-lookup.ts` → `GET /api/v1/admin/assignees` (`can({ quote: ['read'] })`, returns active admin users who have `quote.update`: `{id, name, email}[]`); Rewrite `tests/support/session.ts` to create a real Better Auth user+session for a given role (`sessionCookie(role: RoleName = 'owner'): Promise<string>`); Create `tests/integration/rbac-api.test.ts`.

**Interfaces — Produces:** `type AppEnv = { Variables: { actor: Actor | null } }`; `can(perms: Permissions)`; `c.get('actor')`. Permission mapping for existing routes: content routers → `content[read|create|update|delete]` per method; site-settings section PATCH → `page[update]` for page-copy sections (home/services/our-work/insurance/about/process heroes) and `settings[update]` for business/contact/socials/branding/seo; quote routes → `quote[...]`; contact routes → `contact[...]`; media admin → `media[read|upload|update|delete]`; legacy `/api/v1/users` (customers) → `user[list|create]`; `/auth/me` → `signedIn`, returns `MePayload`. Remove `/auth/login` + `/auth/logout` (Better Auth handles sign-in/out).

- [ ] Step 1: `rbac-api.test.ts` table-driven: for each role, a representative read + write per resource returns 2xx or 403 per the matrix (Review Focus 4); role `user` session → 403 on every admin route (Review Focus 1); no session → 401. Update existing integration tests to `sessionCookie('owner')`.
- [ ] Steps 2–4: RED, implement, GREEN (`yarn test` all).
- [ ] Step 5: Commit `feat(api): guard admin API with the MK role matrix`.

### Task 6: Users & account API (MK users module)

**Files:** Create `src/validations/user-admin-schema.ts` (MK `lib/users/schema.ts` minus author), `src/server/services/user-admin/{guard,manage,service,view-as}.ts`, `src/server/api/admin-users.ts` (mount `/admin/users`), `src/server/api/account.ts` (mount `/account` → sessions list/revoke/revoke-others), `tests/integration/users-admin.test.ts`. Source: MK `server/modules/users/*`, `server/modules/account/routes.ts`.

**Interfaces — Produces:** routes exactly MK's table minus `PUT /:id/author`; invite/resend responses include `manualLink` when SMTP absent; `UserDto` (MK). Owner protection, advisory-lock `underAccessLock`, `LAST_OWNER` 409, sessions dropped on role change/ban, View-as 1 h with `impersonate-admins` for owner/admin targets, all audited.

- [ ] Step 1: Tests: invite (no SMTP) → 201 with `manualLink` and audit `user.invite`; admin cannot invite an owner (403); last owner demote/ban/delete → 409 `LAST_OWNER` (Review Focus 2); role change revokes target sessions; ban → target's next request 401; impersonate → cookie, writes during View-as refused (Review Focus 5); viewer → 403 on all.
- [ ] Steps 2–4: RED, implement, GREEN. Step 5: commit `feat(api): add users & roles and account session endpoints`.

### Task 7: Page guards, proxy and client permissions

**Files:** Create `src/lib/admin/route-permissions.ts` (`permissionFor(path: string): Permissions` for every current `/dashboard/*` route — throws for unknown; Phase 3 replaces with the nav registry), `src/features/auth/hooks/use-me.ts`, `src/contexts/actor-provider.tsx` (`ActorProvider`, `useActor()`, `useCan(perms)`); Modify `src/proxy.ts` (Better Auth session cookie presence check, `/login` redirect when signed in, keep matcher), every dashboard page using `PermissionGate` (28) → `await requirePermission(permissionFor('/dashboard/...'))`, `(dashboard_layout)/layout.tsx` (`requireActor`, `ActorProvider`), `src/components/layout/sidebar/index.tsx` + `site-nav-items.ts` (filter by `hasPermission`), quote assignee dropdowns (`quote-inbox-detail.tsx`, `new-enquiry-dialog.tsx`, `quote-detail-view.tsx`) → `GET /admin/assignees`; Delete `src/lib/permission/*`, `src/server/lib/session.ts` usage (keep file only if still imported — prefer delete).

- [ ] Step 1: Tests: unit test `permissionFor` covers every dashboard route file (glob `src/app/**/dashboard/**/page.tsx` → every path resolves); integration: role `user` and anonymous → layout redirects (test the `requireActor`/`requirePermission` helpers with mocked `redirect`).
- [ ] Steps 2–4: RED, implement, GREEN; `yarn build` succeeds.
- [ ] Step 5: Commit `feat(admin): guard dashboard pages and nav with role permissions`.

### Task 8: MK auth screens

**Files:** Create under `src/app/(auth)/`: `login/page.tsx` (replace), `forgot-password/page.tsx`, `reset-password/page.tsx` (handles `invite=1` "Set your password"), `two-factor/page.tsx`, `two-factor-setup/page.tsx`, shared `layout.tsx`; `src/features/auth/components/{sign-in-form,two-factor-form,two-factor-setup,forgot-password-form,reset-password-form,password-input,auth-header,back-to-sign-in}.tsx`, `src/features/auth/lib/auth-errors.ts`, `src/features/auth/hooks/use-sign-out.ts`; Modify `src/features/auth/` old login form/hooks (delete), user menu logout → `useSignOut`. Source: MK `app/(admin)/admin/(auth)/*`, `admin/modules/auth/*`. Add `qrcode.react` (or MK's QR lib, pinned) if MK uses it.

**Interfaces:** sign-in → `authClient.signIn.email`; if `twoFactorRedirect` → `/two-factor`; success → `next` (sanitised via MK `safeNext`) or `/dashboard`. Visuals copied from MK (spacing, sizes, copy), VANTAGE logo from site settings.

- [ ] Step 1: Tests: unit tests for `safeNext` (rejects external/`//` URLs) and `auth-errors` mapping; integration happy path for reset-password token flow via `auth.api` (request reset with SMTP absent captures manual link → reset → sign in with new password).
- [ ] Steps 2–4: RED, implement, GREEN; manual check in browser by controller later.
- [ ] Step 5: Commit `feat(auth): add MK-style sign-in, reset and two-factor screens`.

### Task 9: Users & roles screen; retire legacy admin users

**Files:** Create `src/features/users/{components/{users-view,users-table,invite-dialog,role-dialog,ban-dialog,confirm-dialog,permission-matrix,view-as-banner,manual-link-dialog}.tsx,hooks/api/*,services/api.ts,types,utils/query-keys.ts}`, `src/app/(main)/(protected)/(dashboard_layout)/dashboard/users/page.tsx`; Modify sidebar (Users & roles item → `/dashboard/users`, permission `user[list]`), `(dashboard_layout)/layout.tsx` (View-as banner); Delete `src/features/admin-users/**`, `dashboard/admins/**`, `src/server/api/admins.ts` + its service/repository/validation, `src/server/db/seed-admin.ts`, `src/lib/routes` entries for admins. Source: MK `admin/modules/users/*` (People/Roles tabs; no author dialog).

- [ ] Step 1: Tests: component test (vitest + testing-library if present in MK setup; else integration via API) that invite dialog shows the manual link when returned; unit test for `present.ts` helpers (status labels).
- [ ] Steps 2–4: RED, implement, GREEN; `yarn build`; grep shows no imports of deleted modules.
- [ ] Step 5: Commit `feat(admin): add users & roles screen and retire legacy admin users`.

### Phase exit check

- [ ] `yarn tsc --noEmit` (ignore generated `LayoutProps`), `yarn lint` 0 errors, `yarn test` green, `yarn build` OK.
- [ ] Controller browser check: sign in as `owner@vantage.test` and an existing migrated admin; `viewer@vantage.test` sees read-only nav and gets `/unauthorized` on a write page; intake sees only quotes/contacts; public site 200.
