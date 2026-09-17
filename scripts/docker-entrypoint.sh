#!/bin/sh
set -eu

mkdir -p .wrangler/state .sites-runtime

if [ -z "${ADMIN_PASSWORD_HASH:-}" ]; then
  echo "ADMIN_PASSWORD_HASH is required. Generate a PBKDF2 hash before starting the container." >&2
  exit 1
fi

cat > .dev.vars <<EOF
ADMIN_EMAILS=${ADMIN_EMAILS:-}
ADMIN_USERNAME=${ADMIN_USERNAME:-Admin}
ADMIN_PASSWORD_HASH=${ADMIN_PASSWORD_HASH:-}
SESSION_COOKIE_SECURE=${SESSION_COOKIE_SECURE:-false}
EOF

cat > dist/server/.dev.vars <<EOF
ADMIN_EMAILS=${ADMIN_EMAILS:-}
ADMIN_USERNAME=${ADMIN_USERNAME:-Admin}
ADMIN_PASSWORD_HASH=${ADMIN_PASSWORD_HASH:-}
SESSION_COOKIE_SECURE=${SESSION_COOKIE_SECURE:-false}
EOF

if [ ! -f .wrangler/state/.migrated ]; then
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_grey_champions.sql
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_common_shriek.sql
  touch .wrangler/state/.migrated
fi

exec node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 0.0.0.0 --port "${PORT:-8787}" --inspector-port 0
