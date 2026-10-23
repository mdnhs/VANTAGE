# Admin MK Parity — Roadmap

**Spec:** `docs/superpowers/specs/2026-10-22-admin-mk-parity-design.md`
**Reference code ("MK"):** `/Users/nazmulhasansourab/ireland/james-whitfield`

The spec spans 11 subsystems whose later parts consume interfaces the earlier parts create,
so it is delivered as **one plan per phase**, each written just before execution against the
real code the previous phase left behind. Every phase ends with the public site and the admin
working, `yarn tsc --noEmit`, `yarn lint` and `yarn test` green.

| #   | Phase plan                                          | Delivers                                                                                                                                                                                                                                                                    | Depends on |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `2026-10-22-admin-mk-parity-phase-1-foundations.md` | vitest unit+integration infra, env + VPS build, crypto/secrets, `settings` + `revisions`, R2 media pipeline + `media` table + upload API (backend only), SMTP mailer with no-SMTP mode                                                                                      | —          |
| 2   | phase-2-auth-rbac                                   | Better Auth admin + twoFactor (TOTP; email OTP only when SMTP), MK role matrix + VANTAGE resources, admin_users → users migration script, `audit_logs` + `audit()` writer, demo-user seed (`SEED_DEMO_USERS`), MK login/forgot/reset/2FA screens, API guards on RBAC        | 1          |
| 3   | phase-3-shell                                       | nav registry, sidebar/topbar/dock/section rail, ⌘K, page header + dashboard kit, sonner, admin frame; every existing VANTAGE screen moved into the shell unchanged in behaviour; Users & roles screen                                                                       | 2          |
| 4   | phase-4-settings                                    | GlobalEditor + schema-form + history sheet; settings pages (Identity, Contact, Navigation, Footer, Forms & microcopy, Notifications, Privacy); website-page forms on settings keys; site_settings → key/value migration script (dry-run/verify); public site reads new keys | 3          |
| 5   | phase-5-media-migration                             | media library UI + picker; every upload field → picker; Cloudinary → R2 migration script (images, hero video, inquiry photos, FK rewrite); `cldUrl` → R2 URLs; Cloudinary removed                                                                                           | 1, 3, 4    |
| 6   | phase-6-seo                                         | SEO overview/checks/alt-text/issues, defaults + crawl preview, redirects (+ proxy), per-page SEO tab                                                                                                                                                                        | 4, 5       |
| 7   | phase-7-marketing                                   | tracking (GTM/GA4/Pixel/CAPI encrypted), consent banner, event catalogue, custom code; public-site event emission                                                                                                                                                           | 4          |
| 8   | phase-8-appearance                                  | theme engine, admin theming, limited site theming (brand red family + fonts via CSS vars, pixel-identical defaults), history/draft/publish                                                                                                                                  | 3, 4       |
| 9   | phase-9-ai                                          | AI settings + assistant sheet + tools + conversations + rate limit                                                                                                                                                                                                          | 2, 3, 4    |
| 10  | phase-10-activity-notifications                     | activity log UI, notifications bell (quote, contact, CAPI, delivery failure), enquiries mail link                                                                                                                                                                           | 2, 3       |
| 11  | phase-11-parity-pass                                | screen-by-screen visual/behaviour comparison with MK, fixes                                                                                                                                                                                                                 | all        |

Execution: superpowers:subagent-driven-development — implementer and reviewer subagents on
Sonnet 5.5, plans written on Opus 5.5. Branch `feat/admin-mk-parity`.

Pre-existing uncommitted landing-page work on this branch is **not** part of these phases;
implementers stage only the files their task names (`git add <paths>`, never `git add -A`).
