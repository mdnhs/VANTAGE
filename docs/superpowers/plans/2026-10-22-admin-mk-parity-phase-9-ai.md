# Admin MK Parity — Phase 9: AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port MK's admin AI assistant to VANTAGE: an owner/admin settings page (provider, encrypted write-only API key, model + List models, allowed roles, enquiry-sharing opt-in, extra instructions, max reply length, Test connection), a topbar sparkle button + ⌘J right-hand sheet with streamed chat, starters, route-context chip, markdown, copy/stop/regenerate/edit, saved per-user conversations with history, read-only VANTAGE tools filtered by the actor's permissions, a DB-backed rate limit of 30 messages / 10 min / user, and audit rows that never hold message text.

**Architecture:** Port MK (`/Users/nazmulhasansourab/ireland/james-whitfield`) `lib/ai/*`, `server/modules/ai/*`, `server/db/schema/ai.ts`, `admin/modules/ai/*` into VANTAGE's layout (`src/lib/ai/*`, `src/server/services/ai/*`, `src/server/repositories/ai-conversation-repository.ts`, `src/server/api/admin-ai.ts`, `src/features/ai/*`). Same SDK as MK — Vercel AI SDK server-side (`streamText` → UI message stream through the Hono route), `@ai-sdk/react` `useChat` with a custom transport in the sheet. Settings live in the Phase 1 `settings` table under key `ai` behind their own endpoint (not a `GLOBALS` entry, because the key is write-only and must never enter revisions). Tools call VANTAGE services with the requesting actor and are offered only when the actor's roles allow them.

**Tech Stack:** `ai@7.0.116`, `@ai-sdk/react@4.0.119`, `@ai-sdk/google@4.0.82`, `@ai-sdk/anthropic@4.0.65`, `@ai-sdk/openai-compatible@3.0.57` (MK's exact pins), zod v4, Hono, Drizzle, react-query, shadcn `sheet`, sonner, vitest (node + happy-dom).

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md` (§2 item 8, §4 secrets, §5.2 IA "Site settings › AI assistant", §5.3 RBAC, §5.7, §6) · **Roadmap:** `docs/superpowers/plans/2026-10-22-admin-mk-parity-roadmap.md` (row 9) · **MK design:** `/Users/nazmulhasansourab/ireland/james-whitfield/docs/superpowers/specs/2026-10-11-ai-assistant-design.md` (behaviour authority for everything this plan does not override).

## Global Constraints

- Branch `feat/admin-mk-parity`. **This phase runs in parallel with Phases 5, 7, 8 and 10**, each in its own git worktree with its own test DB (`vantage_<slot>_test`). Stage only the files a task names (`git add <paths>`, never `git add -A`). Edits to shared files are limited to exactly what the "Shared files" section lists.
- Port MK behaviour, copy and rulings verbatim except where this plan's Rulings say otherwise. Read the MK file named in each task before writing its VANTAGE counterpart; adapt imports (`getDb()` → `db` from `@/server/db`, MK `ApiError("X", …)` → VANTAGE `ApiError` statics / `ERROR_CODES`, `c.json(x)` → `ok(c, x)`, MK `queryKeys`/`aiApi` → `src/features/ai/services/api.ts`).
- Code style: VANTAGE (single quotes, semicolons, `'server-only'` first line in server files, Prettier 120 cols), not MK's.
- **No real provider calls in any test.** Server tests set `vi.stubEnv('AI_PROVIDER_MOCK', 'true')` (NODE_ENV is `test`, so the mock is allowed) or call `buildModel`/`listModels` with a stubbed `fetch`. Never put a real key in tests or fixtures.
- **API key:** AES-256-GCM via existing `encryptSecret/decryptSecret(…, AI_KEY_PURPOSE)` (`src/server/lib/secrets.ts`, purpose `'ai.apiKey'` already defined). Never returned to the client (GET returns `{ hasKey, last4, readable }` only), never in audit diffs, revisions, logs, error text or the react-query cache.
- **Works with AI disabled:** `enabled` defaults to `false`; with it off (or the role switched off, or no key) the topbar shows nothing to non-managers and `/admin/ai/chat` answers 403; owners/admins still see the button, which opens a "Set up the AI assistant" state linking to `/dashboard/settings/ai-assistant`. Nothing else in the admin changes.
- Keep every VANTAGE core feature; no existing endpoint, page or permission changes behaviour.
- Limits (MK R11): chat 30 / 10 min / user, test connection 5 / min / user, list models 10 / min / user — all through existing `actorLimit` (`src/server/middleware/actor-limit.ts`, Postgres `rate_limits`), placed after the permission guard. 429 with `Retry-After`.
- Input ≤ 8 000 chars, `maxOutputTokens` 64–8192 default 1024, history = last 20 messages within 32 000 chars, ≤ 5 tool steps, retention 90 days, title = first message trimmed to 60 chars.
- Audit actions: `ai.settings_update` (redacted top-level diff; key shown only as `configured/none → replaced/removed`), `ai.share_enquiry_details`, `ai.test_connection`, `ai.chat` (provider · model · tokens in/out · tool names · regenerated/edited/stopped — **never text or titles**), `ai.conversation_delete`.
- Dependencies (exact pins, `yarn add --exact`): `ai@7.0.116`, `@ai-sdk/react@4.0.119`, `@ai-sdk/google@4.0.82`, `@ai-sdk/anthropic@4.0.65`, `@ai-sdk/openai-compatible@3.0.57`. No other new deps (no `@testing-library/user-event`; use `fireEvent`).

## Rulings (this phase)

- **V9-R1 SDK — mirror MK.** MK uses the Vercel AI SDK with `@ai-sdk/anthropic` / `@ai-sdk/google` / `@ai-sdk/openai-compatible` directly (no gateway, no `@anthropic-ai/sdk`); the spec lists the same packages. VANTAGE does the same.
- **V9-R2 Models.** Provider default stays MK's `google`. `DEFAULT_MODEL = { google: 'gemini-flash-lite-latest', anthropic: 'claude-opus-5-5', 'openai-compatible': '' }` — the Anthropic suggestion is the current default Claude model (`claude-opus-5-5`, per the claude-api skill) instead of MK's `claude-haiku-4-5`; owners can still type or list any model. Requests never set `temperature`, `topP`, thinking options or a forced `toolChoice` (Claude Opus 5.5 rejects disabled thinking, sampling params and forced tool choice with a 400); `streamText` uses the SDK's default `auto` tool choice. Thinking on Claude Opus 5.5 is always on and counts toward `maxOutputTokens`, so a turn that ends with `finishReason: 'length'` and no text maps to the friendly error `LENGTH_EXHAUSTED_MESSAGE` (Task 3). Anthropic's server-side refusal `fallbacks` parameter is not exposed by `@ai-sdk/anthropic`, so it is not enabled; a `content-filter` finish maps to `DECLINED_MESSAGE`.
- **V9-R3 Read-only tools only.** Spec §2 item 8 and MK §5/§10 both ship read-only tools and list write tools as out of scope. There are no write tools, so no write-confirmation flow is built; the assistant's prompt says it cannot change anything and people copy what they want.
- **V9-R4 Storage.** `settings` row key `ai` (MK R2), own endpoint `/api/v1/admin/ai/settings`, optimistic `version`, no revision snapshots. `globals.ts`, `global-access.ts` and `global-ui.ts` are untouched.
- **V9-R5 Roles (MK R4).** Owner and admin always keep the assistant; `allowedRoles` gates editor, author, marketer, intake, viewer (default all five). `permissions.ts` already grants `ai: ['use']` to every role and `ai: ['manage']` to owner/admin — no edit. `shareEnquiryDetails` can be changed by `owner` only.
- **V9-R6 Mock.** `mockEnabled() = serverEnv().AI_PROVIDER_MOCK === true && process.env.NODE_ENV !== 'production'` (VANTAGE has no `SITE_ENV`). `localHttpAllowed() = process.env.NODE_ENV === 'development'` (plain `http://localhost` base URLs for Ollama/LM Studio in dev only).
- **V9-R7 View-as.** `notViewingAs` on `PUT /settings`, `POST /settings/test`, `POST /settings/models`, `POST /chat`, `DELETE /conversations/:id` (VANTAGE puts it on every mutation; MK only on chat/delete). Reads (status, settings GET, conversation list/get) work while viewing — the viewed person's own conversations, read-only, as MK.
- **V9-R8 Enquiry data.** One opt-in, `shareEnquiryDetails`, covers quotes and contact messages. Counts are available to every role that may use the assistant (MK `getEnquiryStats` parity); money figures (`salesRevenue`, `pipelineValue`) only with `quote.read`. Details need the opt-in **and** `quote.read` (quotes) / `contact.read` (contacts) and are limited to: first name, service type / service, vehicle make + model + year (quotes), status, created date (Irish time), message/description ≤ 500 chars, newest 20. Never: last name, email, phone, address, city, eircode, registration, photos, admin notes, payment/invoice fields, assignee. `getQuoteRequest` is offered only when the opt-in is on and the actor has `quote.read`.
- **V9-R9 SEO health.** Phase 6 (full SEO checks) is not merged when this phase runs. `getSeoHealth` (needs `seo.read`) returns a minimal report over the `seo` global (`titleTemplate` lacks `%s` / empty, `defaultDescription` empty or outside 50–160 chars, no `defaultOgImage`, `robots === 'noindex'`) with a score of `100 − 20 × issues` floored at 0. Phase 6/11 swaps `seoHealth()` for the full report without touching the tool contract `{ label, score, issues: { where, problem }[] }`.
- **V9-R10 Context.** VANTAGE's editable "pages" are the `page.*` globals. `ChatContext.entity` is `{ type: 'page', key: PageKey }` where `PageKey` ∈ `'page.home' | 'page.services' | 'page.our-work' | 'page.insurance' | 'page.about' | 'page.process'`; routes map `/dashboard/home-page`→`page.home`, `/dashboard/services`→`page.services`, `/dashboard/projects`→`page.our-work`, `/dashboard/insurance`→`page.insurance`, `/dashboard/about`→`page.about`, `/dashboard/process-page`→`page.process` (exact path, not sub-routes). `/dashboard/quotes` and `/dashboard/contacts` set screen `'enquiries'`. Paths must match `^/dashboard(/[A-Za-z0-9._~%/-]*)?$`.
- **V9-R11 Retention / GDPR.** User deletion cascades (FK). Retention purge (messages older than 90 days, then empty or 90-day-idle conversations) runs from `yarn jobs:retention` after `runRetention` — `retention-service.ts` and `RetentionResult` stay unchanged. VANTAGE has no DSAR export or lead-erasure flow, so MK's `exportConversationsFor` / `eraseMessagesMentioning` are not ported.
- **V9-R12 Tests.** VANTAGE has no Playwright; MK's E2E cases become integration tests (API) and happy-dom component tests.
- **V9-R13 Persistence (MK R9).** Saved assistant messages keep text parts and, for finished tool calls, a label only (`{ output: { label } }`); the wire to the browser carries labels only (`labelOnlyChunk`). Reasoning parts are never sent (`sendReasoning: false`) nor saved.

## Shared files (parallel phases — touch exactly this, nothing more)

| File                                                           | Edit in this phase                                                                                                                                                                                                                                                                                                                          | Task | Merge note                                                                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `yarn.lock`                                    | add the 5 exact-pinned deps above                                                                                                                                                                                                                                                                                                           | 1    | Other phases add deps too; on conflict keep both sets and re-run `yarn install`.                                                                          |
| `src/server/db/schema/index.ts`                                | append `export * from './ai';`                                                                                                                                                                                                                                                                                                              | 2    | Append-only line; keep others' lines.                                                                                                                     |
| `src/server/db/migrations/*` + `meta/_journal.json` + snapshot | one generated migration `NNNN_ai_conversations.sql`                                                                                                                                                                                                                                                                                         | 2    | Generate **after rebasing** on the latest `feat/admin-mk-parity`; the controller renumbers on merge (see DB migrations).                                  |
| `src/server/api/index.ts`                                      | `import { adminAi } from './admin-ai';` + `.route('/admin/ai', adminAi)` after `.route('/admin/search', adminSearch)`                                                                                                                                                                                                                       | 3    | One import + one chain line.                                                                                                                              |
| `src/lib/routes/api-routes.ts`                                 | add an `ai` block (paths below)                                                                                                                                                                                                                                                                                                             | 3    | Append a new top-level key; no existing key changes.                                                                                                      |
| `src/lib/admin/nav.ts`                                         | add child `{ id: 'settings-ai-assistant', label: 'AI assistant', href: '/dashboard/settings/ai-assistant', permission: { ai: ['manage'] }, keywords: ['ai', 'assistant', 'gemini', 'claude', 'openai', 'chatbot'] }` as the last child of `settings`; add `'ai'` to that section's `keywords`                                               | 6    | Only the `settings` section changes.                                                                                                                      |
| `src/components/admin/shell/topbar.tsx`                        | replace the disabled `<Tooltip>…SparklesIcon…</Tooltip>` block with `<AiAssistant />` (same position: directly before the Enquiries link); drop now-unused `SparklesIcon`, `Button`, `Tooltip*` imports                                                                                                                                     | 7    | Phase 10 edits the Enquiries link / bell in the same file: keep both; the AI button must stay immediately before the Enquiries link.                      |
| `scripts/retention.ts`                                         | after `runRetention`, when not `--dry-run`, call `purgeStaleConversations(new Date())` and print `ai conversations: N, messages: M`; with `--dry-run` print `ai conversations: (not counted in dry run)`                                                                                                                                    | 2    | Phase 5 Task 5 may also change this file's summary line (new `RetentionResult` photo counts): keep both edits; the AI line prints after the enquiry line. |
| **Not touched**                                                | `src/lib/auth/permissions.ts` (ai grants already present), `src/lib/content/globals.ts`, `src/lib/content/global-access.ts`, `src/features/globals/global-ui.ts`, `src/components/admin/shell/admin-shell.tsx`, `src/server/lib/secrets.ts`, `src/lib/env.ts`, `.env.example` (`AI_PROVIDER_MOCK` already documented), `tests/test-env.mjs` | —    | —                                                                                                                                                         |

`api-routes.ts` `ai` block:

```ts
ai: {
  status: '/admin/ai/status',
  settings: '/admin/ai/settings',
  models: '/admin/ai/settings/models',
  test: '/admin/ai/settings/test',
  chat: '/admin/ai/chat',
  conversations: '/admin/ai/conversations',
  conversation: (id: string) => `/admin/ai/conversations/${id}`,
},
```

## DB migrations

- **`NNNN_ai_conversations`** (one file, Task 2): `yarn db:generate --name ai_conversations` after rebasing. Creates `ai_conversations` (`id uuid pk default random`, `user_id text not null → users.id on delete cascade`, `title text not null`, `model text not null`, `created_at`, `updated_at timestamptz not null default now()`; indexes `ai_conversations_user_updated_idx (user_id, updated_at desc)`, `ai_conversations_updated_idx (updated_at)`) and `ai_messages` (`id uuid pk`, `conversation_id uuid not null → ai_conversations.id on delete cascade`, `role text not null` with check `ai_messages_role_check role in ('user','assistant')`, `parts jsonb not null`, `tokens_in integer`, `tokens_out integer`, `shared_enquiry_details boolean not null default false`, `created_at timestamptz not null default now()`; index `ai_messages_conversation_idx (conversation_id, created_at)`). At HEAD the next number is `0024`; parallel phases also add migrations, so the controller renumbers at merge (rename file + journal `idx`/`tag` + snapshot) and re-runs `yarn db:migrate` on a fresh DB.

## Task graph and concurrency

```
T1 ──┬── T2 ──────────┐
     ├── T3 ──┬── T4 ─┼── T5 ── T7
     │        └── T6  │
     └────────────────┘
```

- T1 first (deps + isomorphic lib). Then **T2 ∥ T3** (no shared files). After T3: **T4 ∥ T6** (and T2 if still running). T5 needs T2 + T3 + T4. T7 needs T5 (and T6 only for the settings link target, which may be stubbed). T6 and T7 both add files under `src/features/ai/`; they share only `src/features/ai/services/api.ts`, which T3 creates — T6/T7 add functions to it, append-only.

## Review Focus

1. **The API key escapes** — through `GET /settings`, an audit diff, a provider error echoing it ("invalid key sk-…abcd"), a server log line, or the List-models/Test-connection response. Expected: only `hasKey/last4/readable` ever leave the server; provider text is sanitised (key → `[hidden]`, URLs → `[address]`). → Task 3 tests `never returns or logs the key`.
2. **Assistant turned off or role switched off while a sheet is open** — the next send must be refused (403 with "The AI assistant is turned off" / "…isn't available for your role"), the status query flips, non-managers lose the button, managers see the set-up state. → Task 5 test `refuses when disabled or role gated` + Task 7 test `hides for gated non-managers`.
3. **Someone else's conversation id** in `GET/DELETE /conversations/:id`, or as `conversationId` / `editMessageId` on chat → 404 "Conversation not found", nothing written. → Task 2 + Task 5 tests.
4. **Enquiry PII with sharing off** — a quote's email/phone/registration/last name reaching tool output, the saved reply or the next turn's history; and after sharing is switched off, earlier replies written under it must leave the history. → Task 4 test `redacts enquiry fields` + Task 5 test `drops shared replies from history once sharing is off`.
5. **Stop mid-stream / provider failure / length-exhausted Claude turn** — the saved assistant row is a complete message (no half tool calls), an `ai.chat` audit row is still written with "· stopped", and the sheet shows the friendly message (`LENGTH_EXHAUSTED_MESSAGE` for a `length` finish with no text). → Task 5 tests `saves partial reply on abort` + `maps length-exhausted finish`.

---

### Task 1: Dependencies + isomorphic AI lib

**Files:**

- Modify: `package.json`, `yarn.lock` (deps above)
- Create: `src/lib/ai/schema.ts`, `src/lib/ai/messages.ts`, `src/lib/ai/labels.ts`
- Test: `src/lib/ai/schema.test.ts`, `src/lib/ai/messages.test.ts`
- MK source: `lib/ai/{schema,messages,labels}.ts` (+ tests)

**Interfaces:**

- Produces (`schema.ts`): `AI_PROVIDERS = ['google','anthropic','openai-compatible'] as const`, `type AiProvider`, `PROVIDER_LABELS`, `DEFAULT_MODEL` (V9-R2), `MANAGER_ROLES = ['owner','admin']`, `GATED_ROLES: RoleName[]` (= `ROLE_NAMES` minus managers), `MAX_INPUT_CHARS = 8000`, `OUTPUT_TOKENS = { min: 64, max: 8192, default: 1024 }`, `GEMINI_FREE_TIER_WARNING` (MK text), `ModelId`, `baseUrlProblem(raw: string, allowLocalHttp: boolean): string | null`, `normaliseBaseUrl(raw: string): string`, `AiSettingsUpdate` + type, `ListModelsInput` + type, `PAGE_KEYS = ['page.home','page.services','page.our-work','page.insurance','page.about','page.process'] as const`, `type PageKey`, `ChatContext = z.object({ path: /^\/dashboard(\/[A-Za-z0-9._~%/-]*)?$/ max 200, entity: z.object({ type: z.literal('page'), key: z.enum(PAGE_KEYS) }).optional() })`, `ChatInput` (MK superRefine rules verbatim), `ConversationParam = z.object({ id: z.uuid() })`.
- Produces (`labels.ts`): `TOOL_LABELS = { searchContent: 'a search of the site', getPage: 'a page', getSeoHealth: 'SEO health', getDashboardSummary: 'the dashboard', getQuoteStats: 'quote numbers', getQuoteRequest: 'a quote request', getContactStats: 'contact message numbers' } as const`, `type ToolName`.
- Produces (`messages.ts`, verbatim MK): `AiMetadata`, `AiUIMessage`, `AiPart`, `HISTORY_LIMIT = 20`, `HISTORY_CHAR_BUDGET = 32_000`, `textOf`, `toolLabel`, `persistableParts`, `labelOnlyChunk`, `textOnly`, `trimHistory`.

- [ ] **Step 1: Install deps** — `yarn add --exact ai@7.0.116 @ai-sdk/react@4.0.119 @ai-sdk/google@4.0.82 @ai-sdk/anthropic@4.0.65 @ai-sdk/openai-compatible@3.0.57`. Expected: `package.json` shows the five without `^`.
- [ ] **Step 2: Port the tests first** — MK `schema.test.ts` and `messages.test.ts`, adapted: admin paths are `/dashboard/...`; add:

```ts
it('accepts a page-key entity and rejects other entity types', () => {
  expect(ChatContext.safeParse({ path: '/dashboard/about', entity: { type: 'page', key: 'page.about' } }).success).toBe(
    true,
  );
  expect(
    ChatContext.safeParse({ path: '/dashboard/about', entity: { type: 'article', id: crypto.randomUUID() } }).success,
  ).toBe(false);
  expect(ChatContext.safeParse({ path: '/admin/pages' }).success).toBe(false);
});
it('suggests claude-opus-5-5 for Anthropic', () => {
  expect(DEFAULT_MODEL.anthropic).toBe('claude-opus-5-5');
});
it('gates every non-manager role by default', () => {
  expect(GATED_ROLES).toEqual(['editor', 'author', 'marketer', 'intake', 'viewer']);
});
```

- [ ] **Step 3: Run** `yarn vitest run --project unit src/lib/ai` → FAIL (modules missing).
- [ ] **Step 4: Implement** the three files (MK verbatim except the VANTAGE values above; `baseUrlProblem` example text stays MK's).
- [ ] **Step 5: Run** the same command → PASS; `yarn tsc --noEmit` clean.
- [ ] **Step 6: Commit** `git add package.json yarn.lock src/lib/ai && git commit -m "feat(ai): add AI SDK deps and shared assistant schemas"`.

### Task 2: Conversations table, repository, retention

**Files:**

- Create: `src/server/db/schema/ai.ts`, migration `src/server/db/migrations/NNNN_ai_conversations.sql` (+ meta), `src/server/repositories/ai-conversation-repository.ts`
- Modify: `src/server/db/schema/index.ts`, `scripts/retention.ts`
- Test: `tests/integration/ai-conversations.test.ts`
- MK source: `server/db/schema/ai.ts`, `server/modules/ai/conversations.ts`, `tests/integration/api/ai-conversations.test.ts`

**Interfaces:**

- Consumes: `AiUIMessage`, `AiPart`, `textOnly` (Task 1); `audit()`; `Actor`.
- Produces (all exported from the repository; MK names and semantics): `aiConversations`, `aiMessages` tables; `titleFrom(text: string): string` (≤ 60 chars, one line); `createConversation(userId: string, title: string, model: string)`; `ownConversation(userId: string, id: string)` → row or `ApiError.notFound('Conversation not found')`; `appendMessage(conversationId, message: AiUIMessage, meta?: { tokensIn?: number; tokensOut?: number; sharedEnquiryDetails?: boolean })` (also bumps `updated_at`); `dropLastReply(conversationId)`; `ownUserMessage(conversationId, id)` (404 `Message not found` unless a `user` row of that conversation); `replaceFrom(conversationId, from: { id: string; createdAt: Date }, message: AiUIMessage)`; `historyFor(conversationId, limit: number, options: { includeShared: boolean }): Promise<AiUIMessage[]>`; `RETENTION_DAYS = 90`; `listConversations(userId)` → `{ id, title, model, updatedAt: string }[]` (newest 50); `getConversation(userId, id)` → `{ id, title, model, messages: AiUIMessage[] }` (newest 200, oldest first); `deleteConversation(actor: Actor, id)` → `{ ok: true }` + audit `ai.conversation_delete` in the same transaction; `purgeStaleConversations(now: Date, dbLike?: DbLike)` → `{ conversations: number; messages: number }`.

- [ ] **Step 1: Write the failing integration tests** (`truncate ai_messages, ai_conversations, audit_logs, users cascade` in `beforeEach`; users via `createTestUser`):
  - `lists, reads and deletes only the owner's conversations` — B's `ownConversation(B, idOfA)` / `getConversation` / `deleteConversation` reject with status 404; A's list excludes B's rows.
  - `deleting a user cascades conversations and messages`.
  - `appendMessage bumps updatedAt and keeps token counts`.
  - `replaceFrom drops the edited message and everything after it`.
  - `historyFor excludes sharedEnquiryDetails rows unless includeShared` and returns text parts only.
  - `purgeStaleConversations removes messages older than 90 days, then empty or idle conversations, and keeps fresh ones` — expect `{ conversations: 2, messages: 3 }` on a fixture of one fresh, one idle, one emptied conversation.
  - `deleteConversation writes ai.conversation_delete without the title` — `summary === 'Deleted an AI assistant conversation'`, summary/diff do not contain the title.
- [ ] **Step 2: Run** `yarn vitest run --project integration tests/integration/ai-conversations.test.ts` → FAIL.
- [ ] **Step 3: Implement** `schema/ai.ts` (MK table with VANTAGE explicit snake_case column names, `userId: text('user_id')`), export it from the index, rebase on the latest branch, then `yarn db:generate --name ai_conversations` and `yarn db:migrate` against the worktree DB. Implement the repository.
- [ ] **Step 4: Run** the test → PASS. Run `yarn jobs:retention --dry-run` against dev → prints the extra line, exits 0.
- [ ] **Step 5: Commit** `git add src/server/db/schema/ai.ts src/server/db/schema/index.ts src/server/db/migrations src/server/repositories/ai-conversation-repository.ts scripts/retention.ts tests/integration/ai-conversations.test.ts && git commit -m "feat(ai): store assistant conversations with 90-day retention"`.

### Task 3: AI settings, providers, mock, settings API

**Files:**

- Create: `src/server/services/ai/{settings,provider,mock-model,models,errors,service}.ts`, `src/server/api/admin-ai.ts` (settings + status routes only), `src/features/ai/services/api.ts`, `src/features/ai/utils/query-keys.ts`, `src/features/ai/types.ts`
- Modify: `src/server/api/index.ts`, `src/lib/routes/api-routes.ts`
- Test: `src/server/services/ai/{provider,models,errors}.test.ts`, `tests/integration/ai-settings.test.ts`
- MK source: `server/modules/ai/{settings,provider,mock-model,models,errors,service,routes}.ts` and their tests, `tests/integration/api/ai-settings.test.ts`

**Interfaces:**

- Consumes: Task 1 schemas; `encryptSecret`, `decryptSecret`, `secretsAvailable`, `SecretKeyMissingError`, `SecretKeyInvalidError`, `AI_KEY_PURPOSE`; `settingsRepository` / `settings` table; `conflictError`, `userName` (`src/server/lib/conflict.ts`); `topLevelDiff` (`@/lib/audit/top-level-diff`); `audit()`; `actorLimit`; `notViewingAs`; `can`, `actorOf`; `ok`; `zValidator`.
- Produces (`settings.ts`): `AI_SETTINGS_KEY = 'ai'`, `AiStored` (MK zod, VANTAGE defaults), `type AiStored`, `parseAiSettings(value: unknown): AiStored`, `readAiSettings(dbLike?: DbLike): Promise<{ row: Setting | null; value: AiStored }>`, `roleAllowed(s: AiStored, roles: readonly RoleName[]): boolean`, `decryptApiKey(s: AiStored): string | null`, `isConfigured(s: AiStored): boolean`.
- Produces (`provider.ts`): `type ModelSettings = { provider: AiProvider; model: string; baseUrl: string; apiKey: string | null }`, `mockEnabled(): boolean`, `localHttpAllowed(): boolean` (V9-R6), `buildModel(s: ModelSettings): LanguageModel` (no-redirect fetch, MK R6), `getModel(s: ModelSettings): Promise<LanguageModel>` (lazy-imports the mock when `mockEnabled()`).
- Produces (`mock-model.ts`): MK `mockUsage`, `textParts`, `toolCallParts`, `streamOf`, `mockModel(modelId?)` with VANTAGE triggers: `/\bseo\b/i` → `getSeoHealth`, `/\bquotes?\b/i` → `getQuoteStats` (`{ range: '30d' }`), `/\blength-test\b/` → a finish with `finishReason: { unified: 'length' }` and no text, `/\bdecline-test\b/` → `content-filter` finish with no text; otherwise `Mock reply: <text>` streamed word by word (30 ms per chunk, as MK).
- Produces (`errors.ts`): MK `ProviderHttpError`, `sanitise`, `providerMessage`, `errorTag`, `TOOL_FAILED`, `ToolFailure`, `friendlyChatError(error, provider)`, plus `LENGTH_EXHAUSTED_MESSAGE = "The answer ran out of room before it was finished. An owner or admin can raise the maximum reply length in AI assistant settings."` and `DECLINED_MESSAGE = "The AI provider declined to answer this one. Try rephrasing it."`.
- Produces (`models.ts`): `listModels(input: { provider: AiProvider; baseUrl: string; apiKey: string | null }, fetchImpl?: typeof fetch): Promise<string[]>` (MK).
- Produces (`service.ts`): `getAiStatus(actor): Promise<AiStatus>` with `AiStatus = { available: boolean; canManage: boolean; provider: AiProvider | null; model: string | null; freeTierWarning: boolean }`; `getAiAdmin(): Promise<AiAdmin>` with `AiAdmin = { version; value: Omit<AiStored,'apiKeyEncrypted'|'apiKeyHint'>; apiKey: { hasKey; last4; readable }; keyAvailable; localHttpAllowed; mock }`; `saveAiSettings(actor, input: AiSettingsUpdate): Promise<AiAdmin>` (MK logic: 409 on stale version via `conflictError`, R3 key never follows a provider/host change, managers stripped from `allowedRoles`, owner-only sharing with acknowledgement, two audit rows); `listModelsFor(actor, input: ListModelsInput)`; `testConnection(actor): Promise<{ ok: boolean; message: string }>`. `AiStatus` and `AiAdmin` types are re-exported from `src/features/ai/types.ts` as plain types for the client.
- Produces (routes, `admin-ai.ts`): `export const AI_CHAT_LIMIT = { limit: 30, windowMs: 600_000 }`, `AI_TEST_LIMIT = { limit: 5, windowMs: 60_000 }`, `AI_MODELS_LIMIT = { limit: 10, windowMs: 60_000 }`; `GET /status` `can({ ai: ['use'] })`; `GET /settings` `can({ ai: ['manage'] })`; `PUT /settings` manage + `notViewingAs` + `zValidator('json', AiSettingsUpdate)`; `POST /settings/models` manage + `notViewingAs` + `actorLimit('ai-models', AI_MODELS_LIMIT)`; `POST /settings/test` manage + `notViewingAs` + `actorLimit('ai-test', AI_TEST_LIMIT)`. All JSON through `ok(c, …)`. `export const adminAi = new Hono<AppEnv>()…`.
- Produces (client `services/api.ts`): `aiApi = { status(): Promise<AiStatus>; getSettings(): Promise<AiAdmin>; saveSettings(input: AiSettingsUpdate): Promise<AiAdmin>; listModels(input: ListModelsInput); testConnection() }`, error class `AiApiError(message, status, code?, causes?, current?)` mirroring `GlobalApiError`; base URL from `NEXT_PUBLIC_API_PREFIX + NEXT_PUBLIC_API_VERSION` and `API_ROUTES.ai`. Query keys in `src/features/ai/utils/query-keys.ts` (VANTAGE feature convention): `AI_KEYS = { status: ['ai','status'], settings: ['ai','settings'], conversations: ['ai','conversations'], conversation: (id: string) => ['ai','conversation', id] } as const`.

- [ ] **Step 1: Port unit tests** — MK `provider.test.ts`, `models.test.ts`, `errors.test.ts` (stubbed `fetch`, no network). Add `mockEnabled is false when NODE_ENV is production even if AI_PROVIDER_MOCK is true` (`vi.stubEnv('NODE_ENV','production')`).
- [ ] **Step 2: Write integration tests** `tests/integration/ai-settings.test.ts` (`vi.stubEnv('AI_PROVIDER_MOCK','true')`):
  - `status hides provider and model from a gated non-manager` and `shows them to owner/admin`.
  - `only owner and admin can read or save settings` — editor/viewer `GET /settings` → 403.
  - `never returns or logs the key` — save `apiKey: 'sk-test-0123456789abcd'`; GET body JSON string contains neither the key nor its ciphertext; `apiKey.last4 === 'abcd'`; `audit_logs.diff` for `ai.settings_update` has `apiKey: { from: 'none', to: 'replaced' }` and no ciphertext; then with `vi.stubEnv('AI_PROVIDER_MOCK','false')` and `vi.stubGlobal('fetch', …)` answering 401 `{"error":{"message":"invalid key sk-test-0123456789abcd at https://x.example/v1"}}`, `POST /settings/models` (provider google, no typed key → uses the saved one) returns `ok: false` with a message containing `[hidden]` and `[address]` and not the key, and a `console.error` spy never receives the key.
  - `a stale version is a 409 with updatedBy`.
  - `changing provider drops the stored key unless a new one is sent` (MK R3) and `enabling without a key is a field error on enabled`.
  - `admin cannot change enquiry sharing; owner must acknowledge` (403 / 422 `shareEnquiryDetails.acknowledge`), and owner enabling writes `ai.share_enquiry_details`.
  - `saving a key without APP_ENCRYPTION_KEY is a field error on apiKey` (`vi.stubEnv('APP_ENCRYPTION_KEY','')`).
  - `test connection with the mock answers ok and is audited`; `the sixth test in a minute is 429 with Retry-After`.
  - `writes are refused while viewing as someone` (`viewAsCookie`) → 403 `IMPERSONATION_READ_ONLY` on PUT/test/models.
- [ ] **Step 3: Run** `yarn vitest run --project unit src/server/services/ai && yarn vitest run --project integration tests/integration/ai-settings.test.ts` → FAIL.
- [ ] **Step 4: Implement** the service files, `admin-ai.ts`, mount in `index.ts`, add the `api-routes.ts` block, `features/ai/services/api.ts` + `types.ts`.
- [ ] **Step 5: Run** both → PASS; `yarn tsc --noEmit`, `yarn lint` clean.
- [ ] **Step 6: Commit** `feat(ai): add AI assistant settings, providers and mock model` (stage only the files above).

### Task 4: Read-only VANTAGE tools + system prompt + context

**Files:**

- Create: `src/server/services/ai/{tool-data,tools,prompt,context,flatten}.ts`
- Test: `src/server/services/ai/{prompt,flatten}.test.ts`, `tests/integration/ai-tools.test.ts`
- MK source: `server/modules/ai/{tool-data,tools,prompt,context,flatten}.ts`

**Interfaces:**

- Consumes: `AiStored` (Task 3); `ToolFailure`, `errorTag` (Task 3); `TOOL_LABELS`, `PageKey`, `ChatContext` (Task 1); `hasPermission`; `readEffectiveGlobal` (`globals-service.ts`), `GLOBAL_LABELS`; `quoteRequestRepository` / `contactMessageRepository` (or direct Drizzle reads on `quoteRequests` / `contactMessages` inside `tool-data.ts`), `serviceRepository`, `projectRepository` / `services` & `projects` tables; `analyticsService.getOverviewData()`.
- Produces (`tool-data.ts`, every function returns `ToolResult = { label: string } & Record<string, unknown>` and takes the actor first):
  - `searchContent(actor, query: string)` — website pages (`page.*` labels and hero text, needs `page.read`), services (name/slug/enabled, `content.read`), projects (title/slug/status, `content.read`); ≤ 10 hits each `{ kind: 'page'|'service'|'project', id|key, title, status, snippet ≤ 200 }`; label `Searched for “<query ≤ 40>”`.
  - `readPage(actor, key: PageKey)` — `page.read`; `{ label: '<GLOBAL_LABELS[key]>', key, text }` where `text = flattenValue(value)` ≤ 8 000 chars.
  - `seoHealth(actor)` — V9-R9 contract.
  - `dashboardSummary(actor)` — V9-R8 (counts always; `salesRevenue`/`pipelineValue` only with `quote.read`; never `recentLeads`).
  - `ENQUIRY_RANGES = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 } as const`; `quoteStats(actor, settings, range)` and `contactStats(actor, settings, range)` — counts by status, service type/service, ISO week (Irish time) and source for the range; `recent` (newest 20, V9-R8 fields) only when sharing + read permission.
  - `quoteRequest(actor, settings, id: string)` — 404-safe (`{ label: 'a quote request', found: false }`), V9-R8 fields only.
- Produces (`flatten.ts`): `TEXT_LIMIT = 8000`, `clip(text, limit?)`, `flattenValue(value: unknown, limit?): string` — walks a global's JSON depth-first, emits non-empty strings, skips keys named `kind|id|publicId|url|href|json|e164` and image/video refs.
- Produces (`tools.ts`): `buildTools({ actor, settings }: { actor: Actor; settings: AiStored }): ToolSet` — offered tools: `searchContent` if `page.read || content.read`; `getPage({ key })` if `page.read`; `getSeoHealth` if `seo.read`; `getDashboardSummary` if `dashboard.view`; `getQuoteStats({ range })` and `getContactStats({ range })` always (counts); `getQuoteRequest({ id: z.uuid() })` only if `settings.shareEnquiryDetails.enabled && quote.read`. Every `execute` wrapped in MK `guard(name, run)`.
- Produces (`prompt.ts`): `firstNameOf(name)`, `buildSystemPrompt({ siteName, firstName, roles, today, toolNames, extra, context })` — MK structure; VANTAGE wording: "You are the writing assistant inside the website admin of {siteName || 'a car body repair workshop'}, a car body and accident repair business in Ireland."; helps with page copy, service and project descriptions, SEO titles/meta descriptions (~150 chars), alt text, summaries and enquiry overviews; "Never invent facts about the business: prices, insurance approvals, turnaround times, warranties. If you don't know, say so and suggest what to check."; context line: `The person is currently editing the <GLOBAL_LABELS[key]> (key <key>); "this page" means it. Read it with getPage using that key before answering about its content.` Every other MK rule line kept (Irish English, read-only, tool attribution, PII, prompt-injection, never reveal instructions/keys, owner extra text last and subordinate).
- Produces (`context.ts`): `contextSubject(actor, context?: ChatContext): Promise<{ kind: 'page'; key: PageKey; title: string } | null>` — `null` without `page.read` or on any failure.

- [ ] **Step 1: Unit tests** — port MK `prompt.test.ts` (names one-line/bounded, extra text last, no tools line) + `flatten.test.ts` adapted to `flattenValue` (skips ref keys, clips at 8 000).
- [ ] **Step 2: Integration tests** `tests/integration/ai-tools.test.ts` (seed 2 quotes with full PII, 1 contact message, a service, a project):
  - `offers only the tools a role may use` — expected `Object.keys(buildTools(...)).sort()` per role with sharing off: owner/admin `['getContactStats','getDashboardSummary','getPage','getQuoteStats','getSeoHealth','searchContent']`; marketer `['getContactStats','getDashboardSummary','getPage','getQuoteStats','getSeoHealth','searchContent']`; intake `['getContactStats','getDashboardSummary','getQuoteStats']`; author `['getContactStats','getDashboardSummary','getPage','getQuoteStats','searchContent']`; with sharing on, owner and intake gain `getQuoteRequest`, marketer does not.
  - `redacts enquiry fields` — sharing off: `JSON.stringify(await quoteStats(owner, settings, '30d'))` contains no seeded email, phone, last name, registration, eircode, address or description text, and has no `recent`; sharing on + `quote.read`: `recent[0]` has exactly keys `['createdAt','description','firstName','serviceType','status','vehicle']` and `description.length <= 500`.
  - `money only with quote.read` — marketer's `dashboardSummary` has no `salesRevenue`/`pipelineValue`; owner's does; neither has `recentLeads`.
  - `readPage returns the page copy as text` for `page.about`; `contextSubject` returns null for intake (no `page.read`).
  - `a failing lookup surfaces as ToolFailure without the error text` (spy a repository to throw).
- [ ] **Step 3: Run** `yarn vitest run --project unit src/server/services/ai && yarn vitest run --project integration tests/integration/ai-tools.test.ts` → FAIL.
- [ ] **Step 4: Implement** the five files.
- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** `feat(ai): add permission-filtered read-only assistant tools`.

### Task 5: Chat streaming + conversation routes

**Files:**

- Create: `src/server/services/ai/chat.ts`
- Modify: `src/server/api/admin-ai.ts` (chat + conversation routes)
- Test: `tests/integration/ai-chat.test.ts`
- MK source: `server/modules/ai/chat.ts`, `routes.ts`, `tests/integration/api/{ai-chat,ai-chat-turns}.test.ts`

**Interfaces:**

- Consumes: Task 2 repository, Task 3 settings/provider/errors/limits, Task 4 tools/prompt/context, Task 1 messages; `readEffectiveGlobal('site')` for `siteName`; `audit()`.
- Produces: `MAX_STEPS = 5`; `startChat(actor: Actor, input: ChatInput, signal?: AbortSignal): Promise<Response>` — MK flow verbatim (assertCanChat → getModel → prepareTurn new/regenerate/edit → history from rows with `includeShared = sharing && (quote.read || contact.read)` → `streamText({ … stopWhen: isStepCount(MAX_STEPS), maxOutputTokens, maxRetries: 1, timeout: { totalMs: 120_000, chunkMs: 30_000 }, abortSignal, onError: () => {} })` → `toUIMessageStream` with `sendReasoning: false`, metadata `{ conversationId, userMessageId }` on start, `onEnd` save + `ai.chat` audit → `createUIMessageStreamResponse` with `cache-control: no-cache, no-transform` piped through `labelOnlyChunk`). VANTAGE addition in `onEnd`/`onError`: when the final step's `finishReason` is `'length'` and no text was produced, the stream error text is `LENGTH_EXHAUSTED_MESSAGE`; `'content-filter'` with no text → `DECLINED_MESSAGE`. `today` formatted `EEEE d MMMM yyyy` in `Europe/Dublin`.
- Produces (routes): `POST /chat` `can({ ai: ['use'] })` + `notViewingAs('You can read conversations while viewing as someone, but not send messages')` + `actorLimit('ai-chat', AI_CHAT_LIMIT)` + `zValidator('json', ChatInput)` → returns `startChat(...)` Response as is; `GET /conversations` → `ok(c, { items })`; `GET /conversations/:id` → `ok(c, conversation)`; `DELETE /conversations/:id` + `notViewingAs("You can't delete conversations while viewing as someone")` → `ok(c, { ok: true })`. Client additions to `aiApi`: `conversations()`, `conversation(id)`, `deleteConversation(id)`.

- [ ] **Step 1: Write failing integration tests** (`AI_PROVIDER_MOCK=true`, settings saved enabled with a dummy key; read the SSE body with `await res.text()`):
  - `streams a mock reply and saves both messages` — body contains `Mock reply: hello`; DB has user + assistant rows; one `ai.chat` audit row whose summary matches `/^Asked the AI assistant \(google · .+ · \d+ in \/ \d+ out tokens\)$/` and does not contain `hello`.
  - `a SEO question runs getSeoHealth and saves only its label` — saved assistant parts include a tool part whose `output` deep-equals `{ label: 'SEO health' }`; SSE `tool-output-available` chunks carry only `label`.
  - `refuses when disabled or role gated` — disabled → 403 "The AI assistant is turned off"; `allowedRoles: []` → viewer 403 "The AI assistant isn't available for your role", admin still 200.
  - `another person's conversationId or editMessageId is 404 and writes nothing`.
  - `regenerate replaces the last reply; edit replaces the message and what follows` (row counts + texts).
  - `drops shared replies from history once sharing is off` — seed an assistant row with `sharedEnquiryDetails: true`, turn sharing off, spy `historyFor` result / mock prompt: the shared row's text is absent from the prompt the mock receives.
  - `saves partial reply on abort` — send a long message, abort the request's `AbortController` after the first SSE chunk is read (the mock streams at 30 ms per word); after settle: assistant row text is a prefix of the full mock reply, audit summary ends with `· stopped)`.
  - `maps length-exhausted finish` — message `length-test` → SSE error text equals `LENGTH_EXHAUSTED_MESSAGE`, no assistant row with empty parts; message `decline-test` → SSE error text equals `DECLINED_MESSAGE`.
  - `the 31st message in 10 minutes is 429 with Retry-After`.
  - `View-as can list and read the viewed person's conversations but not send or delete` (403 `IMPERSONATION_READ_ONLY`).
- [ ] **Step 2: Run** `yarn vitest run --project integration tests/integration/ai-chat.test.ts` → FAIL.
- [ ] **Step 3: Implement** `chat.ts`, the routes, the client api additions.
- [ ] **Step 4: Run** → PASS; re-run Task 2–4 suites → PASS.
- [ ] **Step 5: Commit** `feat(ai): stream assistant chat with saved conversations and rate limit`.

### Task 6: AI assistant settings page

**Files:**

- Create: `src/app/(main)/(protected)/(dashboard_layout)/dashboard/settings/ai-assistant/page.tsx`, `src/features/ai/components/settings-view.tsx`, `src/features/ai/hooks/use-ai-settings.ts`
- Modify: `src/lib/admin/nav.ts` (Shared files row)
- Test: `src/features/ai/components/settings-view.test.tsx`, `src/lib/admin/nav.test.ts` (add one case to the existing file)
- MK source: `admin/modules/ai/settings-view.tsx` (+ test), `app/(admin)/admin/(panel)/settings/ai-assistant/page.tsx`

**Interfaces:**

- Consumes: `aiApi.getSettings/saveSettings/listModels/testConnection`, `AI_KEYS`, `AiAdmin` (Task 3); `PROVIDER_LABELS`, `DEFAULT_MODEL`, `GATED_ROLES`, `OUTPUT_TOKENS`, `GEMINI_FREE_TIER_WARNING` (Task 1); `useCan`, actor roles from `@/contexts/actor-provider`; Phase 3 `PageHeader`; shadcn `field`, `input`, `textarea`, `select`, `switch`, `checkbox`, `button`; sonner `toast`.
- Produces: page at `/dashboard/settings/ai-assistant` — `requireActor(path)` then `requirePermission(permissionFor(path), path)` (`permissionFor` resolves to `{ ai: ['manage'] }` via the nav child), `export const instant = false`, metadata title `AI assistant`, robots noindex; `SettingsView` with MK fields, copy and behaviours (explicit Save, 409 → refetch + MK conflict message, write-only key field with "Replace key"/"Remove key", List models fills a datalist with free-text fallback, Test connection result inline, Gemini free-tier warning when provider is google, sharing toggle visible to all managers but enabled only for `owner`, acknowledgement checkbox text: "I confirm the business's data-protection contact approved sending customers' first names, vehicle details and enquiry messages to the AI provider. I understand conversations may then contain enquiry details and are kept for up to 90 days.", "Mock provider is on" note when `mock`, "No APP_ENCRYPTION_KEY" note when `!keyAvailable`).

- [ ] **Step 1: Port MK `settings-view.test.tsx`** to happy-dom + `fireEvent` with a stubbed `fetch` returning `{ success: true, data }`; keep its cases (key field never shows a stored key, provider change suggests `DEFAULT_MODEL`, enabling without key shows the field error, admin sees sharing disabled, owner must tick acknowledgement, 409 shows the conflict message). Add nav case: `reachableLinks(['admin'])` includes `/dashboard/settings/ai-assistant`; `reachableLinks(['editor'])` does not.
- [ ] **Step 2: Run** `yarn vitest run --project unit src/features/ai src/lib/admin` → FAIL.
- [ ] **Step 3: Implement** the hook (react-query `useQuery(AI_KEYS.settings)` + mutations that `setQueryData` with the returned `AiAdmin`, never with the typed key), the view, the page, the nav child.
- [ ] **Step 4: Run** → PASS; `yarn tsc --noEmit`, `yarn lint`.
- [ ] **Step 5: Commit** `feat(ai): add AI assistant settings page`.

### Task 7: Topbar button, ⌘J sheet, chat UI

**Files:**

- Create: `src/components/admin/icons/ai-sparkle-icon.tsx` (MK icon, Hugeicons MIT licence comment), `src/features/ai/components/{assistant,assistant-sheet,assistant-panel,assistant-messages,assistant-composer,ai-avatar,markdown}.tsx`, `src/features/ai/lib/{transport,route-context,starters}.ts`, `src/features/ai/hooks/{use-assistant-hotkey,use-copy,use-ai-status}.ts`
- Modify: `src/components/admin/shell/topbar.tsx` (Shared files row)
- Test: `src/features/ai/components/{assistant,assistant-panel,markdown}.test.tsx`, `src/features/ai/lib/{transport,route-context}.test.ts`, `src/features/ai/hooks/use-assistant-hotkey.test.tsx`
- MK source: `admin/modules/ai/*` (all), `admin/components/icons/ai-sparkle-icon.tsx`

**Interfaces:**

- Consumes: `aiApi.status/conversations/conversation/deleteConversation`, `AI_KEYS`, `AiStatus` (Tasks 3, 5); `AiUIMessage`, `textOf`, `toolLabel`, `ChatContext`, `PageKey` (Task 1); `ICON_BUTTON`; shadcn `sheet`, `dropdown-menu`, `textarea`, `tooltip`; `useChat` from `@ai-sdk/react`; `DefaultChatTransport` from `ai`.
- Produces: `AiAssistant()` (MK: renders nothing unless `status.available || status.canManage`; lazy-loads the sheet chunk on hover/focus; ⌘J/Ctrl+J toggles; `aria-label="AI assistant"`, `aria-keyshortcuts="Meta+J Control+J"`); `contextFromRoute(pathname: string): RouteContext | null` with `AssistantScreen = 'page' | 'enquiries' | 'default'` per V9-R10, `useRouteContext()`, `useContextTitle(route)` → `GLOBAL_LABELS[key]` (no fetch); `chatRequestBody`, `assistantTransport(getConversationId, getContext)` posting to `${NEXT_PUBLIC_API_PREFIX}${NEXT_PUBLIC_API_VERSION}${API_ROUTES.ai.chat}`, `chatErrorMessage(error)` parsing VANTAGE `{ success: false, error: { message } }`; `STARTERS` per screen — default: "Write a meta description for…", "Rewrite this paragraph to sound friendlier: …", "Which pages need SEO work?", "Summarise this week's quote requests"; page: "Suggest a better hero headline for this page", "Write a meta description for this page", "Check this page for spelling and tone", "Summarise this page in two sentences"; enquiries: "How many quotes came in this week?", "Which services are people asking about most?", "How many contact messages are still new?", "Compare this month's quotes with last month". Sheet: MK header (model chip, New chat, history menu with open/delete), empty-state starters (fill composer, never send), `role="log"` `aria-live="polite"`, "Looked at: <label>" lines, Copy per assistant message, Stop while streaming, Regenerate last, Edit own message, focus returns to the button on close, full-screen below 640 px, kept mounted across navigation. Managers with `available: false` see "Set up the AI assistant" linking to `/dashboard/settings/ai-assistant` instead of the composer.

- [ ] **Step 1: Port MK tests** — `transport.test.ts` (body has only new text/ids/context, never history; regenerate sends no text; VANTAGE error envelope parsed), `route-context.test.ts` rewritten for V9-R10 (`/dashboard/about` → page `page.about`; `/dashboard/about/x` → default; `/dashboard/quotes` → enquiries; `/login` → null), `markdown.test.tsx` (no raw HTML, `javascript:` links dropped), `use-assistant-hotkey.test.tsx`, `assistant.test.tsx` + `assistant-panel.test.tsx` with stubbed `fetch` and a stubbed `useChat` transport stream. Add `hides for gated non-managers` (status `{ available: false, canManage: false }` → no button) and `shows the set-up link to managers when unavailable`.
- [ ] **Step 2: Run** `yarn vitest run --project unit src/features/ai` → FAIL.
- [ ] **Step 3: Implement** all files; replace the disabled topbar block with `<AiAssistant />`.
- [ ] **Step 4: Run** → PASS; `yarn tsc --noEmit`, `yarn lint`, `yarn build` OK (sheet is its own chunk: `yarn build` output lists a separate chunk for `assistant-sheet`).
- [ ] **Step 5: Commit** `feat(ai): add topbar AI assistant sheet`.

### Phase exit check

- [ ] `yarn tsc --noEmit`, `yarn lint` 0 errors, `yarn test` green, `yarn build` OK; migration applies on a fresh DB.
- [ ] `grep -rn "apiKeyEncrypted" src/features src/components` → no hits (ciphertext never reaches client code); `grep -rn "@anthropic-ai/sdk\|openai\"" package.json` → no hits.
- [ ] Controller browser check with `AI_PROVIDER_MOCK=true yarn dev`: owner sets up (mock) and enables; topbar sparkle sits before the Enquiries link; ⌘J opens; "seo" shows "Looked at: SEO health"; history reopen/delete; viewer with role switched off sees no button; View-as cannot send; assistant disabled → admin works as before with no AI button for non-managers.
