#!/usr/bin/env bash
#
# Starts BackTrack. Verifies the database is up first, starting it if needed.
#
#   ./start.sh            development server (hot reload)
#   ./start.sh --prod     production build, then serve it

cd "$(dirname "$0")"
source ./scripts-lib.sh

MODE="dev"
[ "${1:-}" = "--prod" ] && MODE="prod"

[ -f .env ] || die ".env not found. Run ./setup.sh first."
[ -d node_modules ] || die "Dependencies not installed. Run ./setup.sh first."

step "Checking PostgreSQL"
COMPOSE=$(detect_compose)
[ -n "$COMPOSE" ] || die "Docker Compose not found. Run ./setup.sh first."

USER_NAME=$(env_value POSTGRES_USER); USER_NAME=${USER_NAME:-backtrack}
DB_NAME=$(env_value POSTGRES_DB); DB_NAME=${DB_NAME:-backtrack_dev}

if ! docker exec backtrack-postgres pg_isready -U "$USER_NAME" -d "$DB_NAME" >/dev/null 2>&1; then
  warn "Database is not running — starting it"
  $COMPOSE up -d
  printf '  waiting'
  for _ in $(seq 1 60); do
    docker exec backtrack-postgres pg_isready -U "$USER_NAME" -d "$DB_NAME" >/dev/null 2>&1 && break
    printf '.'; sleep 1
  done
  printf '\n'
fi
docker exec backtrack-postgres pg_isready -U "$USER_NAME" -d "$DB_NAME" >/dev/null 2>&1 \
  || die "PostgreSQL is not responding. Try: $COMPOSE logs postgres"
ok "Database is ready"

# A port clash otherwise surfaces as a bare EADDRINUSE stack trace after the
# build has already run, which is a confusing place to discover it.
step "Checking port availability"
APP_PORT="${PORT:-3000}"
if lsof -nP -iTCP:"$APP_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  fail "Port $APP_PORT is already in use by another application."
  info "Either stop that application, or run BackTrack on a different port:"
  info "  PORT=3001 AUTH_URL=http://localhost:3001 NEXTAUTH_URL=http://localhost:3001 ./start.sh"
  die "Port $APP_PORT unavailable."
fi
ok "Port $APP_PORT is free"

if [ "$MODE" = "prod" ]; then
  step "Building for production"
  npm run build
  step "Starting production server"
  info "http://localhost:3000  (Ctrl+C to stop)"
  npm start
else
  step "Starting development server"
  info "http://localhost:3000  (Ctrl+C to stop)"
  npm run dev
fi
