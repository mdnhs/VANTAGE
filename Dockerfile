# syntax=docker/dockerfile:1
#
# Build (the build prerenders pages and needs a reachable Postgres, hence --network host):
#   docker build --network host \
#     --build-arg DATABASE_URL=postgresql://vantage:vantage@localhost:5433/vantage \
#     --build-arg AUTH_SECRET=<32+ char value> \
#     --build-arg NEXT_PUBLIC_APP_URL=https://example.com \
#     --build-arg MEDIA_PUBLIC_URL=https://media.example.com \   (required with MEDIA_DRIVER=s3)
#     --build-arg SITE_ENV=production \                          (live site: else robots.txt blocks crawlers)
#     -t vantage .
# Behind a reverse proxy, allow bodies of up to ~111 MB (nginx: client_max_body_size 111m: the public
# forms accept 110 MB, admin uploads 101 MB); the app itself rejects larger bodies with 413.
# Build args live in the builder stage only; the runner stage gets runtime env from the host.
FROM node:24-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM base AS builder
# Public host of the s3 media driver; next.config.ts allows it for next/image. Unset = local driver.
ARG MEDIA_PUBLIC_URL
ENV MEDIA_PUBLIC_URL=$MEDIA_PUBLIC_URL
# Whether the site may be indexed (production | preview | development). robots.txt is prerendered at
# build time, so this MUST be passed as a build arg (and set at runtime) for the live site.
ARG SITE_ENV
ENV SITE_ENV=$SITE_ENV
ARG NEXT_PUBLIC_APP_URL=https://autopaintshop.ie
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG DATABASE_URL
ARG AUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL AUTH_SECRET=$AUTH_SECRET
ENV NEXT_TELEMETRY_DISABLED=1
ENV LD_LIBRARY_PATH=/app/node_modules/@img/sharp-libvips-linux-x64/lib:$LD_LIBRARY_PATH
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    LD_LIBRARY_PATH=/app/node_modules/@img/sharp-libvips-linux-x64/lib:$LD_LIBRARY_PATH
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 -g nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
