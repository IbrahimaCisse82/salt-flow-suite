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
reset_db() {
  psql -q -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB" postgres
  psql -q -c "ALTER DATABASE $DB SET search_path = public, extensions" postgres
  for f in stubs.sql enums.sql tables.sql functions.sql triggers.sql seed.sql; do
    psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null 2>&1
  done
}
status=0
for t in test_cycle.sql test_avoirs.sql; do
  reset_db
  echo "== $t"
  out=$(psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$t" 2>&1) || status=1
  echo "$out" | grep -E "NOTICE: +([A-Z][0-9a-z/]* OK|OK attendu)|ERROR" | sed 's/^psql:[^ ]* //'
done
[ $status -eq 0 ] && echo "Tous les tests SQL sont passés." || { echo "ÉCHEC des tests SQL"; exit 1; }
