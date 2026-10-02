#!/bin/sh
set -eu

mkdir -p .wrangler/state .sites-runtime

if [ -z "${ADMIN_PASSWORD_HASH:-}" ]; then
  echo "ADMIN_PASSWORD_HASH is required. Generate a PBKDF2 hash before starting the container." >&2
  exit 1
fi

write_vars() {
  cat > "$1" <<EOF
ADMIN_EMAILS=${ADMIN_EMAILS:-}
ADMIN_USERNAME=${ADMIN_USERNAME:-Admin}
ADMIN_PASSWORD_HASH=${ADMIN_PASSWORD_HASH:-}
SESSION_COOKIE_SECURE=${SESSION_COOKIE_SECURE:-true}
EOF
  chmod 600 "$1"
}
write_vars .dev.vars
write_vars dist/server/.dev.vars

# Cloudflare's static asset handler defaults to stripping .html from URLs
# (redirecting /file.html -> /file), which breaks things that need the exact
# .html URL to resolve with no redirect — e.g. Google Search Console's
# "HTML file" site-verification check. vinext doesn't expose this as a build
# option, so patch the generated config directly before the server starts.
node -e "
const fs = require('node:fs');
const path = 'dist/server/wrangler.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));
config.assets = { ...config.assets, html_handling: 'none' };
fs.writeFileSync(path, JSON.stringify(config));
"

if [ ! -f .wrangler/state/.migrated ]; then
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_grey_champions.sql
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_common_shriek.sql
  touch .wrangler/state/.migrated
fi
if [ ! -f .wrangler/state/.migrated-0002 ]; then
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_foamy_prodigy.sql
  touch .wrangler/state/.migrated-0002
fi

node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 0.0.0.0 --port "${PORT:-8787}" --inspector-port 0 &
SERVER_PID=$!

# wrangler dev (workerd) is a dev-mode runtime: it has been observed to crash
# internally (kj::Exception, "Connection reset by peer") after days of real
# internet traffic, and the crashed process can keep running without ever
# answering requests again — Docker's own `restart: unless-stopped` policy
# only triggers on process *exit*, so a hung-but-alive process is invisible
# to it. This loop is the fix: once the server has had time to start, if it
# stops answering its own healthcheck for ~30s straight, kill it so the
# container exits and Docker restarts it fresh, instead of silently serving
# nothing for hours or days.
(
  sleep 30
  fails=0
  while kill -0 "$SERVER_PID" 2>/dev/null; do
    sleep 10
    if node -e "fetch('http://127.0.0.1:${PORT:-8787}/api/health',{signal:AbortSignal.timeout(5000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
      fails=0
    else
      fails=$((fails + 1))
      echo "$(date -Iseconds) health check failed ($fails/3)" >&2
    fi
    if [ "$fails" -ge 3 ]; then
      echo "$(date -Iseconds) health check failed 3 times in a row, restarting" >&2
      # SIGKILL, not the default TERM: a genuinely hung process (not just slow)
      # may never get scheduled to handle TERM, so this must be unconditional.
      kill -9 "$SERVER_PID" 2>/dev/null || true
      break
    fi
  done
) &

wait "$SERVER_PID"
