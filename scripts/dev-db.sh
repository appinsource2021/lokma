#!/usr/bin/env bash
# Starts a local PostgreSQL and creates the lokma role and database if missing.
# Works on Debian/Ubuntu hosts and Claude Code cloud sessions (PostgreSQL 16 preinstalled).
set -euo pipefail

if command -v pg_lsclusters >/dev/null && ! pg_lsclusters | grep -q online; then
  sudo -n true 2>/dev/null && SUDO=sudo || SUDO=
  $SUDO service postgresql start
fi

as_postgres() {
  if [ "$(id -u)" = 0 ]; then su postgres -c "$1"; else sudo -u postgres bash -c "$1"; fi
}

as_postgres "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='lokma'\"" | grep -q 1 \
  || as_postgres "psql -qc \"CREATE ROLE lokma LOGIN PASSWORD 'lokma' CREATEDB;\""
as_postgres "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='lokma'\"" | grep -q 1 \
  || as_postgres "createdb -O lokma lokma"

echo "PostgreSQL ready: postgresql://lokma:lokma@localhost:5432/lokma"
