# Перенос сайта «Андруа Фамиль» на новый сервер

Эта инструкция переносит сайт со старого сервера на новый **вместе со всеми
данными**: товары, заказы, возвраты, страницы, картинки и ключи интеграций.

Архитектура нового сервера — **Docker Compose**: три контейнера
(`postgres` + `app` (Next.js) + `nginx`), всё поднимается одной командой.

---

## Что переносится

| Данные | Где лежат | Как переносятся |
|--------|-----------|-----------------|
| База данных (товары, заказы, страницы, промокоды, зашифрованные ключи Ozon) | PostgreSQL | дамп `db.sql.gz` |
| Загруженные картинки (товары, баннеры, категории) | `/uploads` | `uploads.tar.gz` |
| Секреты (`ENCRYPTION_KEY`, пароли) | `.env` | `env.backup` |

> ⚠️ **Самое важное:** `ENCRYPTION_KEY` должен быть **одинаковым** на старом и
> новом сервере. Им зашифрованы ключи Ozon в базе. Если ключ другой — Ozon
> перестанет работать, и ключи придётся вводить заново.

---

## Шаг 1. Бэкап на СТАРОМ сервере

Зайдите на старый сервер, перейдите в папку проекта и выполните:

```bash
cd /путь/к/проекту        # например /srv/sites/andrua-famil или /opt/andrua-famil
bash scripts/backup.sh
```

Скрипт сам найдёт базу и папку с картинками и соберёт один архив:

```
andrua-migration-20260602-1530.tar.gz
```

Если картинки лежат в нестандартном месте — укажите путь вручную:

```bash
UPLOADS_DIR=/srv/sites/andrua-famil/public/uploads bash scripts/backup.sh
```

---

## Шаг 1.5. Освободить НОВЫЙ сервер от старого сайта

Если на новом сервере уже крутится какой-то сайт (статичный HTML и т.п.),
он занимает порты 80/443 — наш Docker-nginx без них не запустится.

Сначала посмотрите, кто слушает порты 80 и 443:

```bash
sudo ss -tlnp '( sport = :80 or sport = :443 )'
```

**Если это системный nginx или Apache** — остановите и отключите автозапуск:

```bash
# nginx
sudo systemctl stop nginx && sudo systemctl disable nginx
# или Apache
sudo systemctl stop apache2 && sudo systemctl disable apache2
```

**Если старый сайт — это другой docker-контейнер** — найдите и остановите его:

```bash
docker ps                       # смотрим что запущено
docker stop <имя_контейнера>    # останавливаем
# если он поднят через compose — в его папке:  docker compose down
```

Старые файлы сайта (обычно `/var/www/html`) можно удалить позже — они не мешают.
Главное, чтобы команда `ss` выше больше ничего не показывала на 80/443.

---

## Шаг 2. Подготовка НОВОГО сервера

На новом сервере (чистая Ubuntu 22.04 / 24.04), от root:

```bash
# скачать и запустить скрипт подготовки
curl -fsSL https://raw.githubusercontent.com/MrMagnat/web_site/main/scripts/server-bootstrap.sh | bash
```

Скрипт поставит Docker, git, firewall, swap (если мало RAM), склонирует код в
`/opt/andrua-famil` и создаст шаблон `.env.production`.

### Заполните `.env.production`

```bash
nano /opt/andrua-famil/.env.production
```

Возьмите значения из бэкапа (`env.backup` внутри архива). Можно посмотреть так:

```bash
cd /opt/andrua-famil
tar xzf ~/andrua-migration-*.tar.gz env.backup -O | grep -E 'ENCRYPTION_KEY|NEXTAUTH_SECRET|ADMIN_'
```

Обязательно перенесите **тот же** `ENCRYPTION_KEY`. Пароль базы
(`POSTGRES_PASSWORD`) можно задать новый — он используется только внутри Docker.

---

## Шаг 3. Перенос архива и восстановление

Скопируйте архив со старого сервера на новый:

```bash
# с вашего компьютера или со старого сервера:
scp andrua-migration-*.tar.gz root@НОВЫЙ_IP:/opt/andrua-famil/
```

На новом сервере:

```bash
cd /opt/andrua-famil
bash scripts/restore.sh andrua-migration-*.tar.gz
```

Скрипт поднимет базу, зальёт дамп, восстановит картинки, соберёт и запустит
приложение. Сборка занимает несколько минут.

Проверьте, что всё поднялось:

```bash
docker compose -p andrua ps
docker compose -p andrua logs -f app
```

Сайт уже должен открываться **по IP** нового сервера.

---

## Шаг 4. Домен (DNS)

В панели регистратора домена `andrua-famil.ru` поменяйте A-запись на IP нового
сервера (и `www`, если есть). Обновление DNS занимает от минут до пары часов.

Проверить, куда сейчас указывает домен:

```bash
dig +short andrua-famil.ru
```

---

## Шаг 5. SSL-сертификат (HTTPS)

nginx ожидает сертификаты Let's Encrypt в `/etc/letsencrypt`. Два варианта:

### Вариант A — скопировать сертификаты со старого сервера (быстро)

```bash
# на старом сервере:
tar czf letsencrypt.tar.gz -C /etc letsencrypt
scp letsencrypt.tar.gz root@НОВЫЙ_IP:/root/

# на новом сервере:
tar xzf /root/letsencrypt.tar.gz -C /etc
docker compose -p andrua restart nginx
```

Сертификаты продолжат автопродление, если на новом сервере настроен certbot
(см. вариант B для установки certbot и таймера).

### Вариант B — выпустить заново (после переключения DNS)

DNS уже должен указывать на новый сервер.

```bash
# временно останавливаем nginx-контейнер, чтобы освободить порт 80
docker compose -p andrua stop nginx

apt-get install -y certbot
certbot certonly --standalone -d andrua-famil.ru -d www.andrua-famil.ru \
  --agree-tos -m admin@andrua-famil.ru --non-interactive

docker compose -p andrua start nginx
```

Certbot сам поставит таймер автопродления (`systemctl list-timers | grep certbot`).
После продления перезапускайте nginx: добавьте в `/etc/letsencrypt/renewal-hooks/deploy/`
скрипт с `docker compose -p andrua restart nginx`.

---

## Шаг 6. Проверка

- [ ] Сайт открывается по `https://andrua-famil.ru`
- [ ] Каталог показывает товары, у товаров есть картинки
- [ ] Вход в админку `/admin/login` работает
- [ ] В админке → Интеграции → Ozon: ключи на месте, импорт/статусы работают
      *(если не работают — значит `ENCRYPTION_KEY` не совпал, перенесите старый)*
- [ ] Заказы и страницы сайта на месте

---

## Обновление сайта в будущем

После переноса любые обновления выкатываются одной командой:

```bash
cd /opt/andrua-famil && bash deploy.sh
```

(делает `git pull`, пересборку контейнеров и миграции).

---

## Регулярные бэкапы (рекомендация)

Раз в сутки делайте бэкап базы. Пример cron на новом сервере:

```bash
# crontab -e
0 4 * * * cd /opt/andrua-famil && bash scripts/backup.sh && find . -name 'andrua-migration-*.tar.gz' -mtime +7 -delete
```

---

## Если что-то пошло не так

| Симптом | Причина / решение |
|---------|-------------------|
| Ozon-ключи «слетели», импорт не работает | `ENCRYPTION_KEY` не совпадает со старым. Впишите старый ключ в `.env.production`, затем `bash deploy.sh` |
| nginx не стартует | Нет сертификатов в `/etc/letsencrypt`. См. Шаг 5 |
| Сборка падает (Killed / OOM) | Мало RAM. `server-bootstrap.sh` создаёт swap; проверьте `free -h` |
| Нет картинок | uploads не попали в бэкап. Проверьте `UPLOADS_DIR` на старом сервере и повторите бэкап |
| `docker compose` не найден | Запустите `server-bootstrap.sh` ещё раз — он ставит Docker |
