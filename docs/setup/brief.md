# VANTAGE — Project Brief

## What

Next.js 16 enterprise app, EU-first, cost-optimized. Same-origin Hono API over Neon Postgres (Drizzle ORM), deployed on Vercel.

## Stack

- Next.js 16 (App Router, RSC, Cache Components)
- Hono.js mounted at `app/api/[[...route]]/route.ts`
- Neon serverless Postgres (aws-eu-west-1 / Dublin) + Drizzle ORM
- Vercel (region `dub1`, matches Neon)
- Tailwind + shadcn/ui (`--pointer`)
- TanStack Query (client data fetching)
- Theme toggle (dark/light)

## Config (from interview)

| Setting              | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| App URL              | `http://localhost:3000` (placeholder, update before deploy) |
| Neon region          | `aws-eu-west-1` (Dublin)                                    |
| Vercel region        | `dub1`                                                      |
| Cloudinary           | skipped (no media yet)                                      |
| API prefix / version | `/api` / `/v1`                                              |
| Optional features    | Theme Toggle, TanStack Query only                           |

## Priorities (in order)

1. Cost — minimize Vercel invocations + Neon compute hours
2. Performance / low EU latency
3. Scalability, clean layered architecture
4. Type safety, security

## Non-goals (for this setup)

- No Cloudinary media pipeline (add later if needed)
- No translation/i18n
- No permission system, NUQS, case-conversion, module-boundary ESLint, API ecosystem wrapper
- No Redis, queues, cron — not until demonstrated need

## Architecture

```
Ireland/EU users → Vercel CDN → Next.js (RSC) + Hono API
                                       ↓
                    Services → Repositories → Drizzle → Neon (EU)
```

Route handler validates → Service (business rules) → Repository (Drizzle only) → DB.
Server Components call services directly — never fetch own `/api`.
