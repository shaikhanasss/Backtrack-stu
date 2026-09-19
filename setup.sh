#!/usr/bin/env bash
#
# BackTrack — one-command local setup.
#
#   ./setup.sh
#
# Checks your tooling, installs dependencies, starts PostgreSQL in Docker,
# migrates and seeds the database, then leaves you ready to run ./start.sh.

cd "$(dirname "$0")"
source ./scripts-lib.sh

printf '\n%s┌────────────────────────────────────────────┐%s\n' "$BOLD" "$RESET"
printf '%s│  BackTrack — Local Setup                   │%s\n' "$BOLD" "$RESET"
printf '%s│  Learn Smart, Score Better                 │%s\n' "$BOLD" "$RESET"
printf '%s└────────────────────────────────────────────┘%s\n' "$BOLD" "$RESET"

# ---------------------------------------------------------------------------
step "1/9  Checking Node.js"
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is not installed."
  info "Install Node.js 20 or newer:"
  info "  macOS    brew install node"
  info "  Ubuntu   sudo apt install nodejs npm"
  info "  Windows  https://nodejs.org/en/download"
  die "Re-run ./setup.sh once Node.js is available."
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  die "Node.js 20+ required, found $(node -v). Upgrade and re-run."
fi
ok "Node.js $(node -v)"

# ---------------------------------------------------------------------------
step "2/9  Checking npm"
command -v npm >/dev/null 2>&1 || die "npm not found. It ships with Node.js — reinstall Node.js."
ok "npm $(npm -v)"

# ---------------------------------------------------------------------------
step "3/9  Checking Docker"
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is not installed."
  info "Docker runs the PostgreSQL database for you."
  info "  macOS / Windows  https://www.docker.com/products/docker-desktop"
  info "  Ubuntu           sudo apt install docker.io"
  die "Install Docker, start it, then re-run ./setup.sh."
fi
if ! docker info >/dev/null 2>&1; then
  fail "Docker is installed but not running."
  info "Start Docker Desktop (or: sudo systemctl start docker) and re-run."
  die "Docker daemon unavailable."
fi
ok "Docker is running"

# ---------------------------------------------------------------------------
step "4/9  Checking Docker Compose"
COMPOSE=$(detect_compose)
[ -n "$COMPOSE" ] || die "Docker Compose not found. Install Docker Desktop, which bundles it."
ok "Using '$COMPOSE'"

# ---------------------------------------------------------------------------
step "5/9  Creating .env"
if [ -f .env ]; then
  ok ".env already exists — leaving it untouched"
else
  [ -f .env.example ] || die ".env.example is missing from the project."
  cp .env.example .env

  # Generate real secrets rather than shipping defaults. Never hardcoded here.
  SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  DBPASS=$(openssl rand -hex 16 2>/dev/null || node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

  TMP=$(mktemp)
  sed -e "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${SECRET}\"|" \
      -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\"${DBPASS}\"|" \
      -e "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://backtrack:${DBPASS}@127.0.0.1:5433/backtrack_dev?schema=public\"|" \
      .env > "$TMP" && mv "$TMP" .env

  ok ".env created with a generated AUTH_SECRET and database password"
fi

# ---------------------------------------------------------------------------
step "6/9  Installing dependencies"
info "This can take a minute on a first run..."
npm install --no-audit --no-fund
# npm 11 gates package install scripts; Prisma and esbuild need theirs.
npm approve-scripts prisma @prisma/client @prisma/engines esbuild unrs-resolver >/dev/null 2>&1 || true
ok "Dependencies installed"

# ---------------------------------------------------------------------------
step "7/9  Starting PostgreSQL"
$COMPOSE up -d
ok "Container starting"

PORT=$(env_value POSTGRES_PORT); PORT=${PORT:-5433}
USER_NAME=$(env_value POSTGRES_USER); USER_NAME=${USER_NAME:-backtrack}
DB_NAME=$(env_value POSTGRES_DB); DB_NAME=${DB_NAME:-backtrack_dev}

printf '  waiting for PostgreSQL'
READY=0
for _ in $(seq 1 60); do
  if docker exec backtrack-postgres pg_isready -U "$USER_NAME" -d "$DB_NAME" >/dev/null 2>&1; then
    READY=1; break
  fi
  printf '.'; sleep 1
done
printf '\n'
[ "$READY" = "1" ] || die "PostgreSQL did not become ready. Check: $COMPOSE logs postgres"
ok "PostgreSQL is accepting connections on port $PORT"

# ---------------------------------------------------------------------------
step "8/9  Preparing the database"
npx prisma generate >/dev/null 2>&1 && ok "Prisma client generated"
npx prisma migrate deploy >/dev/null 2>&1 || npx prisma migrate dev --name init
ok "Migrations applied"
npm run db:seed >/dev/null 2>&1 && ok "Demo data seeded" || die "Seeding failed. Run 'npm run db:seed' to see why."

# ---------------------------------------------------------------------------
step "9/9  Creating upload directories"
mkdir -p uploads/pdfs uploads/images
touch uploads/pdfs/.gitkeep uploads/images/.gitkeep
ok "uploads/pdfs and uploads/images ready"

# ---------------------------------------------------------------------------
printf '\n%s────────────────────────────────────────────%s\n' "$GREEN" "$RESET"
printf '%s Setup complete.%s\n' "$BOLD" "$RESET"
printf '%s────────────────────────────────────────────%s\n\n' "$GREEN" "$RESET"
printf '  Start the app:   %s./start.sh%s\n\n' "$BOLD" "$RESET"
printf '  Demo accounts (from .env):\n'
printf '    Admin    %s / %s\n' "$(env_value SEED_ADMIN_EMAIL)" "$(env_value SEED_ADMIN_PASSWORD)"
printf '    Student  %s / %s\n\n' "$(env_value SEED_STUDENT_EMAIL)" "$(env_value SEED_STUDENT_PASSWORD)"
