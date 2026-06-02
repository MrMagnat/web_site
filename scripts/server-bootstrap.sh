#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  Андруа Фамиль — подготовка ЧИСТОГО сервера (Ubuntu 22.04 / 24.04)
#
#  Запускать ОТ ROOT на новом сервере:
#      curl -fsSL <raw-url>/scripts/server-bootstrap.sh | bash
#  или скопировать файл и:  sudo bash server-bootstrap.sh
#
#  Что делает:
#   1. Ставит Docker + Docker Compose plugin
#   2. Ставит git
#   3. Настраивает firewall (ufw): SSH, 80, 443
#   4. Создаёт swap, если RAM < 2 ГБ (нужно для сборки Next.js)
#   5. Клонирует репозиторий в /opt/andrua-famil
#   6. Создаёт .env.production из шаблона (нужно будет заполнить)
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/MrMagnat/web_site.git}"
APP_DIR="${APP_DIR:-/opt/andrua-famil}"

log() { echo -e "\n\033[1;32m==>\033[0m \033[1m$*\033[0m"; }
warn() { echo -e "\033[1;33m[!]\033[0m $*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Запустите скрипт от root:  sudo bash $0"
  exit 1
fi

# ── 1. Базовые пакеты ────────────────────────────────────────────────────
log "Обновляю систему и ставлю базовые пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git ufw gnupg

# ── 2. Docker ────────────────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
  log "Docker уже установлен — пропускаю"
else
  log "Устанавливаю Docker (официальный скрипт get.docker.com)"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

# Проверяем compose plugin
if ! docker compose version >/dev/null 2>&1; then
  warn "Docker Compose plugin не найден — ставлю docker-compose-plugin"
  apt-get install -y docker-compose-plugin
fi

# ── 3. Firewall ──────────────────────────────────────────────────────────
log "Настраиваю firewall (ufw)"
ufw allow OpenSSH        >/dev/null 2>&1 || ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 4. Swap (если RAM < 2 ГБ) ────────────────────────────────────────────
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "${TOTAL_RAM_MB:-0}" -lt 2000 ] && [ ! -f /swapfile ]; then
  log "RAM ${TOTAL_RAM_MB}МБ < 2ГБ — создаю swap 2ГБ (нужно для сборки)"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  log "Swap не требуется (RAM ${TOTAL_RAM_MB}МБ) или уже существует"
fi

# ── 5. Клон репозитория ──────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Репозиторий уже есть в $APP_DIR — обновляю"
  git -C "$APP_DIR" pull origin main
else
  log "Клонирую репозиторий в $APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# ── 6. .env.production ───────────────────────────────────────────────────
if [ -f .env.production ]; then
  log ".env.production уже существует — не трогаю"
else
  log "Создаю .env.production из шаблона"
  cp .env.production.example .env.production
  warn "ОБЯЗАТЕЛЬНО заполните .env.production перед запуском:"
  warn "    nano $APP_DIR/.env.production"
  warn "Особенно ENCRYPTION_KEY — возьмите ТОТ ЖЕ, что на старом сервере!"
fi

# ── Готово ───────────────────────────────────────────────────────────────
cat <<EOF

\033[1;32m════════════════════════════════════════════════════════════\033[0m
 Сервер готов. Дальнейшие шаги:

 1) Заполните переменные окружения:
      nano $APP_DIR/.env.production

 2) Если переносите данные со старого сервера — выполните на нём
    scripts/backup.sh, скопируйте бандл сюда (scp) и запустите:
      cd $APP_DIR && bash scripts/restore.sh andrua-migration-*.tar.gz

 3) Если это чистая установка (без переноса) — запустите:
      cd $APP_DIR && bash deploy.sh

 4) SSL-сертификат (Let's Encrypt) — см. MIGRATION.md, раздел «SSL».
\033[1;32m════════════════════════════════════════════════════════════\033[0m
EOF
