#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to an EMPTY, ISOLATED restore target}"
: "${BACKUP_FILE:?Set BACKUP_FILE to the .dump archive}"
test -s "$BACKUP_FILE"
if [[ "${CONFIRM_ISOLATED_RESTORE:-}" != "YES" ]]; then
  echo "Refusing restore: set CONFIRM_ISOLATED_RESTORE=YES after verifying target is isolated" >&2
  exit 2
fi
pg_restore --dbname="$RESTORE_DATABASE_URL" --no-owner --no-acl --exit-on-error "$BACKUP_FILE"
echo "Restore completed; run integration tests against the isolated database."
