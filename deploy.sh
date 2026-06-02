#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  Андруа Фамиль — обычный деплой (обновление работающего сервера)
#  Запускать из папки проекта:  bash deploy.sh
# ═══════════════════════════════════════════════════════════════════════
set -e

echo "=== Андруа Фамиль — Deploy ==="

PROJECT="andrua"
DC="docker compose -p $PROJECT --env-file .env.production"

# Проверяем наличие .env.production
if [ ! -f .env.production ]; then
  echo "ERROR: .env.production не найден. Скопируйте из .env.production.example и заполните."
  exit 1
fi

# Обновляем код
git pull origin main

# Пересобираем и перезапускаем контейнеры
$DC up -d --build

# Применяем миграции БД через builder-образ (в рантайме app схемы нет)
echo "Применяю миграции Prisma..."
$DC --profile tools run --rm migrate

echo ""
echo "✓ Деплой завершён! Сайт: https://andrua-famil.ru"
echo "✓ Админка: https://andrua-famil.ru/admin/login"
