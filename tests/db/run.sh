#!/usr/bin/env bash
# Rejoue les tests SQL du cycle de vente sur une base PostgreSQL jetable.
# Usage : PGHOST=... PGPORT=... PGUSER=postgres ./tests/db/run.sh
# Le schéma (tables, fonctions, déclencheurs) est une copie fidèle de la
# production au 21/10/2026, limitée aux objets du cycle de vente.
set -euo pipefail
cd "$(dirname "$0")"
DB=${TEST_DB:-gsel_test}
psql -q -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB" postgres
psql -q -c "ALTER DATABASE $DB SET search_path = public, extensions" postgres
for f in stubs.sql enums.sql tables.sql functions.sql triggers.sql seed.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null
done
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f test_cycle.sql 2>&1 | grep -E "NOTICE: +(T[0-9]|OK)|ERROR"
echo "Tous les tests du cycle de vente sont passés."
