#!/bin/bash
set -e

echo "=== Андруа Фамиль — Deploy ==="

# Check .env.production exists
if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found. Copy from .env.production.example and fill in values."
  exit 1
fi

# Pull latest code
git pull origin main

# Build and restart containers
docker compose --env-file .env.production up -d --build

# Run DB migrations
echo "Running Prisma migrations..."
docker compose exec app npx prisma migrate deploy

echo ""
echo "✓ Deploy complete! Site: https://andrua-famil.ru"
echo "✓ Admin: https://andrua-famil.ru/admin/login"
