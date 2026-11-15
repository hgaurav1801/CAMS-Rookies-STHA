#!/usr/bin/env bash
set -euo pipefail

# Run from CAMS-Rookies-STHA project root.
# Never overwrite the live cams database.

if [[ ! -s backups/cams_phase6_preclosure.sql ||
      ! -f backups/cams_phase6_private_uploads.tar.gz ]]; then
  echo "ERROR: Phase 6 backups are missing."
  echo "Run sandbox setup first."
  exit 1
fi

mkdir -p evidence/phase6

mkdir -p .phase6-sandbox/restore

echo "Preparing isolated recovery database..."

docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot' <<'SQL'

CREATE DATABASE IF NOT EXISTS cams_phase6_restore
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

SQL

echo "Checking that recovery database is empty..."

table_count=$(
  docker compose exec -T db sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot cams_phase6_restore -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()"' |
  tr -d '\r'
)

if [[ "$table_count" != '0' ]]; then
  echo "SAFETY STOP: Recovery database already contains tables."
  echo "Existing data was not changed."
  exit 1
fi

echo "Restoring SQL backup to recovery database..."

docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot cams_phase6_restore' \
  < backups/cams_phase6_preclosure.sql

echo "Restoring private upload archive separately..."

tar -xzf backups/cams_phase6_private_uploads.tar.gz \
  -C .phase6-sandbox/restore

{
  echo "PHASE 6 RECOVERY REHEARSAL"
  echo "Database: cams_phase6_restore"

  echo "Restored table count:"

  docker compose exec -T db sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot cams_phase6_restore -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()"'

  echo "Restored uploaded-file count:"

  find .phase6-sandbox/restore/private \
    -type f | wc -l

  echo "Original cams database was not targeted."

} | tee evidence/phase6/recovery-rehearsal.log

restored_tables=$(
  docker compose exec -T db sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot cams_phase6_restore -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()"' |
  tr -d '\r'
)

if [[ "$restored_tables" != '9' ]]; then
  echo "FAIL: Expected 9 restored tables."
  echo "Found: $restored_tables"
  exit 1
fi

echo "RECOVERY REHEARSAL PASSED: 9 restored tables." |
  tee -a evidence/phase6/recovery-rehearsal.log