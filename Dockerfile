# Build stage — has devDependencies and the full source tree.
FROM node:22.13.0-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage. Note: `wrangler` (and vinext/vite) are devDependencies by npm
# convention, but `wrangler dev` is the actual production server process for this
# self-hosted deployment — so the full node_modules from the build stage is carried
# over rather than reinstalled with --omit=dev, which would delete it. What's
# NOT carried over is the source tree, .git, docs, and build-only files.
FROM node:22.13.0-bookworm-slim AS runtime
WORKDIR /app

ENV PORT=8787 \
    NODE_ENV=production \
    SITES_RUNTIME_ROOT=/app/.sites-runtime \
    WRANGLER_SEND_METRICS=false \
    WRANGLER_WRITE_LOGS=false

RUN groupadd --system --gid 1000 app \
    && useradd --system --uid 1000 --gid app --home-dir /app --shell /usr/sbin/nologin app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts

# Pre-create writable paths and hand them to the non-root user. When the named
# volume for .wrangler/state is first mounted, Docker copies this ownership in.
RUN mkdir -p .wrangler/state .sites-runtime dist/server \
    && chown -R app:app /app

USER app

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8787/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "./scripts/docker-entrypoint.sh"]
