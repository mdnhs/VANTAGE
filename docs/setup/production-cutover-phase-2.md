# Production cutover: Phase 2 (Better Auth + roles)

Replaces the legacy `admin_users` login with Better Auth users and seven roles
(`owner, admin, editor, author, marketer, intake, viewer`). Existing admins
keep their passwords. Read the whole page before starting.

## 1. Environment checklist

| Variable                                                                                                                           | Value                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                                                                                                                      | Reuse the current value. Better Auth reads it too; do not rotate during the cutover.                                                                                                                                                                                                                      |
| `NEXT_PUBLIC_APP_URL`                                                                                                              | The exact public origin, scheme and host, no trailing path (`https://example.com`). Cross-origin writes are rejected against it.                                                                                                                                                                          |
| `BETTER_AUTH_URL`                                                                                                                  | Leave unset unless the public origin differs from the line above. Then set it to the exact public origin; both origins are accepted.                                                                                                                                                                      |
| `APP_ENCRYPTION_KEY`                                                                                                               | New. `openssl rand -base64 32` (32 bytes, base64). Keep it in your secret store; losing it loses stored secrets.                                                                                                                                                                                          |
| `MEDIA_DRIVER=s3`, `S3_ACCOUNT_ID` (or `S3_ENDPOINT`), `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_URL` | R2 / S3 media storage.                                                                                                                                                                                                                                                                                    |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `MAIL_FROM`                                                     | Optional. Without SMTP, invites and resets show a copyable link instead of sending mail.                                                                                                                                                                                                                  |
| `SEED_DEMO_USERS`                                                                                                                  | MUST be unset in production. Demo users are never seeded there.                                                                                                                                                                                                                                           |
| `SITE_ENV`                                                                                                                         | REQUIRED=`production` on the live VPS, as a build argument (`--build-arg SITE_ENV=production`) AND runtime env. `robots.txt` is prerendered at build, so rebuild after changing it. Without it `robots.txt` disallows all crawlers (only Vercel's production deployment counts as production by default). |
| `INTERNAL_ORIGIN`                                                                                                                  | Optional. Defaults to `http://127.0.0.1:$PORT` on the VPS. Set it on Vercel preview deployments (the deployment origin); otherwise redirects are best-effort there.                                                                                                                                       |

`BETTER_AUTH_SECRET` is no longer used; remove it if it is set.

## 2. Reverse proxy (VPS)

Rate limits and the audit log trust `X-Real-IP`. The proxy MUST overwrite it
with the connecting address, never pass a client-supplied value through.

```nginx
server {
  # ...
  client_max_body_size 111m;   # media uploads (100 MB) and public forms (110 MB)

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;                 # overwrite, do not append
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

If another proxy or CDN sits in front, configure nginx to take the real client
address from it (`real_ip_header` / `set_real_ip_from`) so `$remote_addr` is the
visitor, not the CDN.

## 3. Deploy order

1. Backup, and prove the backup restores:
   ```bash
   pg_dump --format=custom --no-owner "$DATABASE_URL_UNPOOLED" > vantage-pre-phase2-$(date +%F).dump
   createdb vantage_restore_check
   pg_restore --no-owner -d vantage_restore_check vantage-pre-phase2-*.dump
   psql vantage_restore_check -c 'select count(*) from admin_users;'   # matches production
   dropdb vantage_restore_check
   ```
2. Set the environment above. Build the new release, do not switch traffic yet.
3. Apply schema migrations: `yarn db:deploy`
4. Plan the admin migration (no writes, never prints hashes):
   `yarn auth:migrate-admins --dry-run`
   Check every email maps to the role you expect. At least one active owner must result.
5. Run it for real: `yarn auth:migrate-admins`
6. Verify: `yarn auth:migrate-admins --verify`. It exits 1 on any mismatch. Fix before continuing.
7. Switch traffic to the new release.
8. Sign in as an owner with the old password. Open Users and roles and check each person.
9. Never run `yarn db:seed-demo-users` in production.

Old admins keep their passwords: bcrypt hashes are carried over and verified
as before; new hashes use Better Auth's default.

## 4. Known behaviour

- Migrated passwords shorter than 12 characters keep working. The 12-character
  minimum applies to any password set from now on (reset, change, invite) for
  admin roles. Customers keep 8.
- To force a short password to change: an owner opens Users and roles and uses
  "Sign out everywhere" for that person, then asks them to use "Forgot password"
  on the sign-in page. The reset enforces the 12-character rule.
- Customers (role `user`) never reach `/dashboard`.

## 5. Rollback

- Before step 7 (traffic still on the old release): nothing user-facing changed.
  Stop; the new tables are unused by the old release.
- After step 7: switch traffic back to the previous release. The old release
  reads `admin_users`, which this migration never modifies, so old logins work
  unchanged. Changes made in the new Users screen (invites, role changes,
  password changes) are not copied back.
- Full restore, only if data was damaged: stop the app, then
  `pg_restore --clean --no-owner -d "$DATABASE_URL_UNPOOLED" vantage-pre-phase2-*.dump`.
  This discards everything written since the backup (quotes, contacts), so
  prefer the traffic switch.

Next: [Phase 4 cutover (site settings)](production-cutover-phase-4.md).
