FROM node:22-bookworm-slim

WORKDIR /app

ENV PORT=8787 \
    SITES_RUNTIME_ROOT=/app/.sites-runtime \
    WRANGLER_SEND_METRICS=false \
    WRANGLER_WRITE_LOGS=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8787

CMD ["sh", "./scripts/docker-entrypoint.sh"]
