#!/usr/bin/env bash
#
# Drops the BackTrack database, re-applies migrations and re-seeds demo data.
# Useful before a demo, or when experiments have left the data in a mess.

cd "$(dirname "$0")"
source ./scripts-lib.sh

printf '\n%s⚠  This deletes ALL data in the BackTrack database.%s\n' "$YELLOW" "$RESET"
info "Every user, board, subject, note, quiz and attempt will be removed"
info "and replaced with the demo dataset."
printf '\n'
printf '  Type %syes%s to continue: ' "$BOLD" "$RESET"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  printf '\n'
  info "Cancelled. Nothing was changed."
  printf '\n'
  exit 0
fi

[ -f .env ] || die ".env not found. Run ./setup.sh first."

step "Checking PostgreSQL"
COMPOSE=$(detect_compose)
USER_NAME=$(env_value POSTGRES_USER); USER_NAME=${USER_NAME:-backtrack}
DB_NAME=$(env_value POSTGRES_DB); DB_NAME=${DB_NAME:-backtrack_dev}

if ! docker exec backtrack-postgres pg_isready -U "$USER_NAME" -d "$DB_NAME" >/dev/null 2>&1; then
  warn "Database is not running — starting it"
  $COMPOSE up -d
  for _ in $(seq 1 60); do
    docker exec backtrack-postgres pg_isready -U "$USER_NAME" -d "$DB_NAME" >/dev/null 2>&1 && break
    sleep 1
  done
fi
ok "Database is ready"

step "Resetting the database"
npx prisma migrate reset --force --skip-seed
ok "Schema dropped and migrations re-applied"

step "Seeding demo data"
npm run db:seed
ok "Demo data restored"

printf '\n%s Reset complete.%s\n\n' "$GREEN$BOLD" "$RESET"
printf '  Admin    %s / %s\n' "$(env_value SEED_ADMIN_EMAIL)" "$(env_value SEED_ADMIN_PASSWORD)"
printf '  Student  %s / %s\n\n' "$(env_value SEED_STUDENT_EMAIL)" "$(env_value SEED_STUDENT_PASSWORD)"
