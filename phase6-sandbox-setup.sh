#!/usr/bin/env bash
set -euo pipefail

# Run from CAMS-Rookies-STHA project root.
# This script must not modify the live cams database.

if [[ ! -f api/sql/schema.sql ||
      ! -f docker-compose.yml ||
      ! -f api/.env ]]; then
  echo "ERROR: Run from CAMS-Rookies-STHA project root."
  echo "Check that api/sql/schema.sql exists."
  exit 1
fi

# Stop if schema contains commands that switch,
# create or drop a database by name.

if grep -Eiq \
  '^[[:space:]]*(USE[[:space:]]+|CREATE[[:space:]]+DATABASE|DROP[[:space:]]+DATABASE)' \
  api/sql/schema.sql; then
  echo "SAFETY STOP: Review database-level commands in schema.sql."
  exit 1
fi

if [[ ! -d api/node_modules ]]; then
  echo "ERROR: API dependencies are missing."
  echo "Run: cd api && npm install"
  exit 1
fi

echo "Checking Docker..."

docker compose ps db

echo "Preparing backup directories..."

mkdir -p backups evidence/phase6

chmod 700 backups

echo "Backing up existing MySQL database..."

docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" mysqldump -u"$MYSQL_USER" --single-transaction --no-tablespaces "$MYSQL_DATABASE"' \
  > backups/cams_phase6_preclosure.sql

echo "Backing up uploaded files..."

tar -czf backups/cams_phase6_private_uploads.tar.gz \
  -C api/storage private

test -s backups/cams_phase6_preclosure.sql

tar -tzf backups/cams_phase6_private_uploads.tar.gz \
  >/dev/null

echo "Backups verified."

# Ignore private backups and sandbox source.

touch .gitignore

grep -qxF '.phase6-sandbox/' .gitignore ||
  printf '\n.phase6-sandbox/\n' >> .gitignore

grep -qxF 'backups/' .gitignore ||
  printf '\nbackups/\n' >> .gitignore

echo "Preparing isolated API directory..."

mkdir -p .phase6-sandbox/api

chmod 700 .phase6-sandbox

rsync -a \
  --exclude=node_modules \
  --exclude=.env \
  --exclude=storage \
  --exclude=tests \
  --exclude=integration-tests \
  --exclude='*.log' \
  api/ .phase6-sandbox/api/

cp api/.env .phase6-sandbox/api/.env

chmod 600 .phase6-sandbox/api/.env

mkdir -p .phase6-sandbox/api/storage/private

chmod 700 .phase6-sandbox/api/storage/private

if [[ ! -e .phase6-sandbox/api/node_modules ]]; then
  ln -s "$(pwd)/api/node_modules" \
    .phase6-sandbox/api/node_modules
fi

echo "Creating separate testing database..."

# No DROP statement is used.
# The existing cams database remains untouched.

docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot' <<'SQL'

CREATE DATABASE IF NOT EXISTS cams_phase6_test
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES
ON cams_phase6_test.*
TO 'cams'@'%';

SQL

echo "Creating test schema..."

docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot cams_phase6_test' \
  < api/sql/schema.sql

echo "Verifying sandbox database configuration..."

(
  cd .phase6-sandbox/api

  DB_NAME=cams_phase6_test \
  node --env-file=.env \
    --input-type=module -e '
      import { pool } from "./src/lib/db.js";

      const [rows] = await pool.query(
        "SELECT DATABASE() AS db"
      );

      await pool.end();

      if (rows[0]?.db !== "cams_phase6_test") {
        throw new Error(
          `SAFETY STOP: Database is ${rows[0]?.db}, not cams_phase6_test`
        );
      }

      console.log(
        "DB isolation verified: cams_phase6_test"
      );
    '

  echo "Seeding sandbox database..."

  DB_NAME=cams_phase6_test npm run seed
)

echo "-----------------------------------"
echo "PHASE 6 SANDBOX SETUP COMPLETED"
echo "-----------------------------------"
echo "Live cams database was not targeted."
echo "Sandbox database: cams_phase6_test"
echo "Sandbox API port: 4001"
echo "-----------------------------------"