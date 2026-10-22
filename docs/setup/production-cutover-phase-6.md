# Phase 6 production cutover (SEO and redirects)

The owner runs this; agents never run it against production. The deploy adds the `redirects` table
(migration 0027), per-page SEO, the sitemap with all eight pages, the generated `/og` share card and
the SEO center in the admin.

**The one setting that matters:** `robots.txt` is prerendered. Without `SITE_ENV=production` it says
`Disallow: /`, so search engines are told to stay away. Nothing breaks visibly, which is why the admin
SEO overview now reports it ("Search engines are blocked: SITE_ENV is not set to production").

## Before you start

- **Where the CLI runs.** `yarn db:deploy` uses `drizzle-kit`, which is not in the standalone runner
  image (`node server.js` only). Run it from a repo checkout of the deployed commit with `yarn install`
  done and the production `DATABASE_URL` loaded, never inside the running container.
- **`SITE_ENV` is also a build argument.** The Dockerfile bakes it in at build time (robots and the
  sitemap are prerendered) and `env_file` supplies it at runtime. docker-compose passes it as a build
  arg from `${SITE_ENV:-}`. Setting it only at runtime is not enough; rebuild after changing it.
- **`INTERNAL_ORIGIN` (optional).** The proxy asks the app itself whether a legacy URL has a redirect, over
  loopback. It defaults to `http://127.0.0.1:$PORT`, and the image sets `PORT=3000` and
  `HOSTNAME=0.0.0.0`, so the default works. Set `INTERNAL_ORIGIN` only if the app listens somewhere else
  (another port, or a container that does not answer on 127.0.0.1). It is read from the environment only;
  never point it at a public address.

## Steps

1. **Back up first.** `pg_dump "$DATABASE_URL" -Fc -f vantage-before-phase6.dump`
2. **Rehearse step 3 on a fresh copy of production** (restore the dump into a scratch database and point
   `DATABASE_URL` at it) before touching the real one.
3. **Migrate the database before the new image starts.** Nothing runs migrations on start. From the repo
   checkout run `yarn db:deploy` (migration 0027 creates `redirects`). If the new image starts first,
   `/api/v1/resolve` errors (redirects silently fail open, so nothing redirects) and
   `/dashboard/seo/redirects` shows an error.
4. **Set the environment.** In the VPS `.env` set `SITE_ENV=production` (and `INTERNAL_ORIGIN` only if
   needed, see above). Keep `NEXT_PUBLIC_APP_URL` set to the public https origin: robots, the sitemap and
   the `Sitemap:` line use it.
5. **Rebuild and restart:** `docker compose up -d --build`. A plain restart is not enough, because robots
   and the sitemap are built into the image.
6. **Verify** (replace `https://example.ie` with the site):
   1. `curl -s https://example.ie/robots.txt` shows `Allow: /` and a `Sitemap: https://example.ie/sitemap.xml`
      line, and no bare `Disallow: /`.
   2. `curl -s https://example.ie/sitemap.xml | grep -c '<loc>'` prints `8`.
   3. `curl -sI https://example.ie/og` returns `200` with `content-type: image/png`. Open it in a browser:
      the card shows the site name from Settings.
   4. Redirects: in `/dashboard/seo/redirects` add `/test-old.html` to `/about` (301), then
      `curl -sI https://example.ie/test-old.html` returns `301` with `location: /about`.
      Reload the redirects list: Hits is `1`. **Delete the test redirect afterwards.** A browser that
      followed a 301 caches it, so check from curl or a private window.
   5. `/dashboard/seo` shows no "Search engines are blocked" issue.

## Behaviour to know

- Staging or preview servers should keep `SITE_ENV` unset or `staging`: they stay out of the index, and the
  admin overview says so. Only the real production site sets `SITE_ENV=production`.
- Browsers cache 301 and 308 redirects. Turning a redirect off or deleting it takes effect on the server at
  once, but a visitor who already followed it keeps going to the old target. Use 302 while testing.
- Redirect sources must be paths the app does not own: live pages, admin, auth pages, API and file paths are
  refused. Destinations may not point into the app (`/api`, `/dashboard`, the sign-in pages, `/_next`).
  Uploaded files may be destinations, so an old `/brochure.pdf` can point at `/uploads/...`.

## Rollback

- Restoring `vantage-before-phase6.dump` removes the `redirects` table with the redirects made since, so
  roll the image back to the Phase 5 build too (the old build does not use the table).
- A restore discards everything made since the backup: admin edits, uploads, and enquiries (quotes and
  contact messages) that arrived in the meantime.
- To undo only the indexing change, set `SITE_ENV` back to empty (or `staging`) and rebuild: `robots.txt`
  goes back to `Disallow: /`.
- Dropping the table by hand is not needed: the previous image ignores it.
