#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  Андруа Фамиль — ВОССТАНОВЛЕНИЕ из бэкапа (запускать на НОВОМ сервере)
#
#  Использование (из папки проекта /opt/andrua-famil):
#      bash scripts/restore.sh andrua-migration-YYYYMMDD-HHMM.tar.gz
#
#  Делает:
#    1. Распаковывает бандл
#    2. Поднимает только Postgres и восстанавливает дамп БД
#    3. Заливает uploads в docker-том и чинит права
#    4. Собирает и поднимает приложение + nginx
#    5. Прогоняет prisma migrate deploy (no-op, если схема из дампа актуальна)
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

log() { echo -e "\n\033[1;32m==>\033[0m \033[1m$*\033[0m"; }
warn() { echo -e "\033[1;33m[!]\033[0m $*"; }
die() { echo -e "\033[1;31mОШИБКА:\033[0m $*"; exit 1; }

BUNDLE="${1:-}"
[ -n "$BUNDLE" ] || die "Укажите файл бэкапа: bash scripts/restore.sh andrua-migration-*.tar.gz"
[ -f "$BUNDLE" ] || die "Файл не найден: $BUNDLE"

PROJECT="andrua"
DC="docker compose -p $PROJECT --env-file .env.production"

[ -f .env.production ] || die ".env.production не найден. Сначала заполните его (см. server-bootstrap.sh)."

# Подтягиваем POSTGRES_* и проверяем ENCRYPTION_KEY
set -a; . ./.env.production; set +a
if grep -q '64_СИМВОЛЬНАЯ_HEX_СТРОКА' .env.production 2>/dev/null; then
  die "В .env.production не заполнен ENCRYPTION_KEY. Возьмите его из env.backup в бандле!"
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ── 1. Распаковка ────────────────────────────────────────────────────────
log "Распаковываю бэкап"
tar xzf "$BUNDLE" -C "$WORK"
[ -f "$WORK/db.sql.gz" ] || die "В бандле нет db.sql.gz"

if [ -f "$WORK/env.backup" ]; then
  warn "В бандле есть env.backup (старый .env). Сверьте ENCRYPTION_KEY:"
  warn "    grep ENCRYPTION_KEY $WORK/env.backup"
  warn "Он ОБЯЗАН совпадать со значением в .env.production, иначе Ozon-ключи не расшифруются."
fi

# ── 2. Postgres + восстановление БД ──────────────────────────────────────
log "Поднимаю только Postgres"
$DC up -d postgres

log "Жду готовности Postgres"
for i in $(seq 1 30); do
  if $DC exec -T postgres pg_isready -U "${POSTGRES_USER:-andrua}" -d "${POSTGRES_DB:-andrua_famil}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  [ "$i" = "30" ] && die "Postgres не поднялся за 60 секунд"
done

log "Восстанавливаю дамп базы (с очисткой существующих таблиц)"
gunzip -c "$WORK/db.sql.gz" | $DC exec -T postgres \
  psql -v ON_ERROR_STOP=0 -U "${POSTGRES_USER:-andrua}" -d "${POSTGRES_DB:-andrua_famil}" >/dev/null
log "База восстановлена"

# ── 3. Uploads → docker-том ──────────────────────────────────────────────
if [ -s "$WORK/uploads.tar.gz" ]; then
  VOL="${PROJECT}_uploads"
  log "Заливаю uploads в том $VOL"
  # создаём том, если ещё не создан (compose создаст при up, но подстрахуемся)
  docker volume create "$VOL" >/dev/null
  docker run --rm -v "$VOL":/data -v "$WORK":/backup alpine \
    sh -c "cd /data && tar xzf /backup/uploads.tar.gz && chown -R 1001:1001 /data"
  log "Загрузки восстановлены и права выставлены (uid 1001 = nextjs)"
else
  warn "В бандле нет картинок (uploads пустой) — пропускаю"
fi

# ── 4. Сборка и запуск всего стека ───────────────────────────────────────
log "Собираю и поднимаю приложение + nginx (может занять несколько минут)"
$DC up -d --build

# ── 5. Миграции (no-op, если дамп уже содержит актуальную схему) ──────────
log "Прогоняю prisma migrate deploy"
$DC --profile tools run --rm migrate || warn "migrate deploy завершился с предупреждением — проверьте логи"

cat <<EOF

\033[1;32m════════════════════════════════════════════════════════════\033[0m
 Восстановление завершено.

 Проверьте:
   $DC ps
   $DC logs -f app

 Сайт должен открываться по IP/домену. Если домен ещё не переключён
 на новый сервер — настройте DNS и SSL (см. MIGRATION.md).
\033[1;32m════════════════════════════════════════════════════════════\033[0m
EOF
