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

# Сначала миграции (через builder-образ; --build обязателен, иначе берётся
# старый кэш без новых миграций). Применяем ДО запуска app, чтобы приложение
# не стартовало против базы без нужных таблиц.
echo "Применяю миграции Prisma..."
$DC --profile tools run --rm --build migrate

# Затем пересобираем и перезапускаем приложение
$DC up -d --build

echo ""
echo "✓ Деплой завершён! Сайт: https://andruafamil.ru"
echo "✓ Админка: https://andruafamil.ru/admin/login"
