#!/usr/bin/env bash
set -euo pipefail
: "${SALECENTAR_DATABASE_URL:?Set SALECENTAR_DATABASE_URL to the intended PostgreSQL database}"
: "${BACKUP_DIR:?Set BACKUP_DIR to a private backup directory}"
umask 077
mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/salecentar-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --dbname="$SALECENTAR_DATABASE_URL" --format=custom --no-owner --no-acl --file="$file"
test -s "$file"
echo "Backup created: $file"
echo "Verify restoration in an isolated test database before treating this as a recoverable backup."
