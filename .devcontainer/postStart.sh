#!/usr/bin/env bash
#
# postStart.sh — auto-start the Tour OP dev stack when the Codespace starts.
# No manual commands needed: waits for Postgres, applies migrations,
# seeds demo accounts (only if the DB is empty), then starts API (3001)
# and Web (3000) in the background.
#
# Run manually any time with:  bash .devcontainer/postStart.sh
#
set -uo pipefail
cd /workspace

API_DIR=/workspace/apps/api
WEB_DIR=/workspace/apps/web
API_LOG=/tmp/tourop-api.log
WEB_LOG=/tmp/tourop-web.log

# Postgres service from .devcontainer/docker-compose.yml
export DATABASE_URL="postgresql://dev:devpass@db:5432/devdb"

log() { echo "[tourop autostart] $*"; }
port_open() { (echo > /dev/tcp/127.0.0.1/$1) >/dev/null 2>&1; }

# --- 0. Dependencies ---------------------------------------------------------
if [ ! -d /workspace/node_modules ]; then
  log "node_modules missing, installing (this takes a few minutes)..."
  (cd /workspace && npm install) || log "WARNING: npm install failed."
fi

# --- 1. Wait for Postgres -----------------------------------------------------
log "Waiting for Postgres (db:5432)..."
READY=0
for _ in $(seq 1 30); do
  if node -e "new (require('pg').Pool)({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(()=>process.exit(0)).catch(()=>process.exit(1))" 2>/dev/null; then
    READY=1; break
  fi
  sleep 2
done
if [ "$READY" = "1" ]; then log "Postgres is up."; else log "WARNING: Postgres not reachable after 60s, continuing anyway."; fi

# --- 2. Migrations ------------------------------------------------------------
log "Applying Prisma migrations..."
(cd "$API_DIR" && npx prisma migrate deploy --schema=prisma/schema.prisma) \
  || log "WARNING: migrate deploy failed (see output above)."

# --- 3. Seed demo accounts only if the DB is empty -----------------------------
USERS=$(node -e "
const {Pool} = require('pg');
const p = new Pool({connectionString: process.env.DATABASE_URL});
p.query('SELECT COUNT(*)::int AS c FROM users')
 .then(r => { console.log(r.rows[0].c); return p.end(); })
 .catch(() => { console.log('ERR'); process.exit(0); });
" 2>/dev/null || echo ERR)
if [ "$USERS" = "0" ]; then
  log "Users table is empty — seeding demo accounts..."
  (cd "$API_DIR" && npm run db:seed) || log "WARNING: db:seed failed."
elif [ "$USERS" = "ERR" ]; then
  log "WARNING: could not read users table, skipping seed."
else
  log "DB already has $USERS user(s), skipping seed."
fi

# --- 4. API --------------------------------------------------------------------
# Kill any existing dev servers first (makes re-running this script safe).
log "Stopping any existing dev servers..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "next/dist/bin/next" 2>/dev/null || true
sleep 3

log "Starting API (log: $API_LOG)..."
(cd "$API_DIR" && nohup npm run dev > "$API_LOG" 2>&1 &)

# --- 5. Web ---------------------------------------------------------------------
log "Starting Web (log: $WEB_LOG)..."
(cd "$WEB_DIR" && nohup npm run dev > "$WEB_LOG" 2>&1 &)

# --- 6. Health check -------------------------------------------------------------
log "Waiting for servers to come up..."
for _ in $(seq 1 30); do
  API_OK=0; WEB_OK=0
  port_open 3001 && API_OK=1
  port_open 3000 && WEB_OK=1
  if [ "$API_OK" = "1" ] && [ "$WEB_OK" = "1" ]; then break; fi
  sleep 4
done
[ "$API_OK" = "1" ] && log "API is listening on 3001." || log "WARNING: API not listening on 3001 — check $API_LOG"
[ "$WEB_OK" = "1" ] && log "Web is listening on 3000." || log "WARNING: Web not listening on 3000 — check $WEB_LOG"

log "Done. API: http://localhost:3001/api/v1 | Web: http://localhost:3000"
log "Logs: tail -f $API_LOG   |   tail -f $WEB_LOG"
