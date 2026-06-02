#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  Андруа Фамиль — БЭКАП для переноса (запускать на СТАРОМ сервере)
#
#  Собирает в один архив:
#    • дамп базы PostgreSQL  (db.sql.gz)
#    • папку загруженных файлов /uploads  (uploads.tar.gz)
#    • .env / .env.production  (секреты, в т.ч. ENCRYPTION_KEY)
#
#  Использование (из папки проекта):
#      bash scripts/backup.sh
#
#  Переопределение путей (если автоопределение не сработало):
#      DATABASE_URL=postgres://...  UPLOADS_DIR=/path/to/uploads  bash scripts/backup.sh
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

log() { echo -e "\n\033[1;32m==>\033[0m \033[1m$*\033[0m"; }
warn() { echo -e "\033[1;33m[!]\033[0m $*"; }
die() { echo -e "\033[1;31mОШИБКА:\033[0m $*"; exit 1; }

STAMP="$(date +%Y%m%d-%H%M)"
WORK="$(mktemp -d)"
OUT="andrua-migration-${STAMP}.tar.gz"
trap 'rm -rf "$WORK"' EXIT

# ── Загружаем переменные окружения ───────────────────────────────────────
ENV_FILE=""
for f in .env.production .env; do
  [ -f "$f" ] && ENV_FILE="$f" && break
done
if [ -n "$ENV_FILE" ]; then
  log "Читаю переменные из $ENV_FILE"
  set -a; . "./$ENV_FILE"; set +a
else
  warn "Не найден .env.production / .env — полагаюсь на переменные окружения"
fi

[ -n "${DATABASE_URL:-}" ] || die "DATABASE_URL не задан. Укажите: DATABASE_URL=... bash scripts/backup.sh"

# ── 1. Дамп базы ─────────────────────────────────────────────────────────
log "Делаю дамп базы данных"
PG_CONTAINER="$(docker ps --filter 'name=postgres' --format '{{.Names}}' 2>/dev/null | head -n1 || true)"

DUMP_ARGS="--no-owner --no-privileges --clean --if-exists"
if [ -n "$PG_CONTAINER" ]; then
  log "Найден контейнер Postgres: $PG_CONTAINER — дампю через него"
  docker exec -e PGPASSWORD="${POSTGRES_PASSWORD:-}" "$PG_CONTAINER" \
    pg_dump $DUMP_ARGS -U "${POSTGRES_USER:-andrua}" "${POSTGRES_DB:-andrua_famil}" \
    | gzip > "$WORK/db.sql.gz"
elif command -v pg_dump >/dev/null 2>&1; then
  log "Использую системный pg_dump"
  pg_dump $DUMP_ARGS "$DATABASE_URL" | gzip > "$WORK/db.sql.gz"
else
  log "pg_dump не найден на хосте — использую временный docker-контейнер postgres:16"
  docker run --rm --network host -e PGPASSWORD="${POSTGRES_PASSWORD:-}" postgres:16-alpine \
    pg_dump $DUMP_ARGS "$DATABASE_URL" | gzip > "$WORK/db.sql.gz"
fi

DB_SIZE="$(du -h "$WORK/db.sql.gz" | cut -f1)"
log "Дамп базы готов ($DB_SIZE)"

# ── 2. Папка uploads ─────────────────────────────────────────────────────
log "Архивирую загруженные файлы (uploads)"
RESOLVED_UPLOADS=""
if [ -n "${UPLOADS_DIR:-}" ] && [ -d "${UPLOADS_DIR}" ]; then
  RESOLVED_UPLOADS="$UPLOADS_DIR"
elif [ -d "./public/uploads" ]; then
  RESOLVED_UPLOADS="./public/uploads"
else
  # Пытаемся достать из docker-тома, оканчивающегося на _uploads или "uploads"
  VOL="$(docker volume ls --format '{{.Name}}' 2>/dev/null | grep -E '(_|^)uploads$' | head -n1 || true)"
  if [ -n "$VOL" ]; then
    log "Нашёл docker-том с загрузками: $VOL — выгружаю"
    docker run --rm -v "$VOL":/data -v "$WORK":/backup alpine \
      sh -c "cd /data && tar czf /backup/uploads.tar.gz ."
  fi
fi

if [ -n "$RESOLVED_UPLOADS" ]; then
  log "Папка загрузок: $RESOLVED_UPLOADS"
  tar czf "$WORK/uploads.tar.gz" -C "$RESOLVED_UPLOADS" .
fi

if [ -f "$WORK/uploads.tar.gz" ]; then
  UP_SIZE="$(du -h "$WORK/uploads.tar.gz" | cut -f1)"
  log "Загрузки заархивированы ($UP_SIZE)"
else
  warn "Папка uploads не найдена — архив без картинок. Если фото есть, укажите UPLOADS_DIR=..."
  : > "$WORK/uploads.tar.gz"  # пустышка, чтобы restore не падал
fi

# ── 3. Секреты (.env) ────────────────────────────────────────────────────
if [ -n "$ENV_FILE" ]; then
  log "Добавляю $ENV_FILE в бандл (содержит ENCRYPTION_KEY — храните бандл в секрете!)"
  cp "$ENV_FILE" "$WORK/env.backup"
fi

# ── 4. Собираем единый бандл ─────────────────────────────────────────────
log "Собираю итоговый архив: $OUT"
tar czf "$OUT" -C "$WORK" .

TOTAL_SIZE="$(du -h "$OUT" | cut -f1)"
cat <<EOF

\033[1;32m════════════════════════════════════════════════════════════\033[0m
 Бэкап готов: $(pwd)/$OUT  ($TOTAL_SIZE)

 Скопируйте его на новый сервер, например:
   scp $OUT root@НОВЫЙ_IP:/opt/andrua-famil/

 Затем на новом сервере:
   cd /opt/andrua-famil && bash scripts/restore.sh $OUT

 ВНИМАНИЕ: архив содержит секреты (.env) — не выкладывайте его публично.
\033[1;32m════════════════════════════════════════════════════════════\033[0m
EOF
