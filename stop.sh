#!/usr/bin/env bash
#
# Stops BackTrack: the Next.js server and the PostgreSQL container.
#
#   ./stop.sh          stop the app, leave the database running
#   ./stop.sh --all    stop the app and the database container

cd "$(dirname "$0")"
source ./scripts-lib.sh

step "Stopping the Next.js server"
# Match this project's own server only, by working directory, so another
# project's dev server on the same machine is left alone.
PIDS=$(pgrep -f "next-server|next dev" 2>/dev/null || true)
STOPPED=0
for pid in $PIDS; do
  CWD=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)
  if [ "$CWD" = "$(pwd)" ]; then
    kill "$pid" 2>/dev/null && { ok "Stopped process $pid"; STOPPED=1; }
  fi
done
[ "$STOPPED" = "1" ] || info "No BackTrack server was running for this project"

if [ "${1:-}" = "--all" ]; then
  step "Stopping PostgreSQL"
  COMPOSE=$(detect_compose)
  if [ -n "$COMPOSE" ]; then
    $COMPOSE stop
    ok "Database container stopped (data is preserved)"
  else
    warn "Docker Compose not found — nothing to stop"
  fi
else
  info "Database left running. Use ./stop.sh --all to stop it too."
fi

printf '\n'
