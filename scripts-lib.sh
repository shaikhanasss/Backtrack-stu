#!/usr/bin/env bash
# Shared helpers for the BackTrack setup scripts.

set -euo pipefail

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'

step()  { printf '\n%s==>%s %s%s%s\n' "$BLUE" "$RESET" "$BOLD" "$1" "$RESET"; }
ok()    { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn()  { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
fail()  { printf '  %s✗%s %s\n' "$RED" "$RESET" "$1"; }
info()  { printf '  %s%s%s\n' "$DIM" "$1" "$RESET"; }

die() { fail "$1"; printf '\n'; exit 1; }

# Resolves the docker compose command for both the v2 plugin and legacy v1.
detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo ""
  fi
}

# Reads a single value out of .env without sourcing the file, so a stray
# character in a password cannot execute as shell.
env_value() {
  local key="$1" file="${2:-.env}"
  [ -f "$file" ] || return 0
  sed -n "s/^${key}=//p" "$file" | head -1 | sed 's/^"//; s/"$//'
}
