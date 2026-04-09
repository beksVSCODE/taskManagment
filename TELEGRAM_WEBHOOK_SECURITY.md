# 🔐 Защита Telegram Webhook - Инструкция по настройке

## Что было исправлено

Добавлена защита Telegram webhook от несанкционированных запросов через проверку секретного токена (`X-Telegram-Bot-Api-Secret-Token`).

### Изменённые файлы:
1. ✅ `TelegramController.java` - добавлена проверка secret token
2. ✅ `setup_telegram_webhook.py` - генерация и установка secret token
3. ✅ `application.properties` - новая переменная `telegram.webhook.secret-token`
4. ✅ `docker-compose.prod.yml` - добавлена переменная `TELEGRAM_WEBHOOK_SECRET_TOKEN`

---

## 🚀 Быстрый старт

### 0. Получение Webhook URL (публичного адреса)

Telegram требует **HTTPS** URL, доступный из интернета. У вас есть несколько вариантов:

#### Вариант A: Production (рекомендуется)
Если у вас есть домен и сервер:
```
https://yourdomain.com  ← Ваш WEBHOOK_URL
```

#### Вариант B: Локальная разработка с ngrok (быстро)
```bash
# 1. Установить ngrok: https://ngrok.com/download
# 2. Запустить туннель
ngrok http 8080

# 3. Скопировать HTTPS URL из вывода:
# Forwarding    https://abc123.ngrok.io -> http://localhost:8080
#                ^^^^^^^^^^^^^^^^^^^^^^
#                Это ваш WEBHOOK_URL
```

#### Вариант C: Cloudflare Tunnel (бесплатно, стабильно)
```bash
# 1. Установить: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
# 2. Запустить туннель
cloudflared tunnel --url http://localhost:8080

# 3. Скопировать URL из вывода
# https://xyz789.trycloudflare.com
```

#### Вариант D: HTTP / Локальный IP
```bash
# ❌ НЕ РАБОТАЕТ С WEBHOOK - Telegram требует HTTPS
http://192.168.1.100:8080  # Локальная сеть
http://localhost:8080       # Только ваш компьютер
```

**Почему HTTP не работает?**
Telegram Bot API **принудительно требует HTTPS** для webhook из соображений безопасности. HTTP webhook URL будет отклонен при попытке установки.

**Альтернатива для локальной разработки: Polling режим**

Вместо webhook можно использовать **polling** (опрос сервера):
- ✅ Не требует публичного URL
- ✅ Работает с HTTP и localhost
- ✅ Проще для отладки
- ❌ Менее эффективен (постоянные запросы к API)
- ❌ Не подходит для production

```bash
# Для локальной разработки БЕЗ webhook:
# 1. Удалить webhook
curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"

# 2. Использовать polling в коде (getUpdates API)
# Backend должен периодически опрашивать Telegram API
# вместо ожидания входящих webhook запросов
```

**Рекомендация:**
- Локальная разработка: используйте **ngrok** (самый простой вариант) или **polling**
- Production: используйте **HTTPS с валидным SSL** (обязательно)

### 1. Первичная настройка (генерация нового токена)

```bash
# Перейти в корень проекта
cd /c/Users/Lenovo/Desktop/full-project

# Установить webhook с автоматической генерацией секрета
python setup_telegram_webhook.py <YOUR_BOT_TOKEN> <YOUR_WEBHOOK_URL>

# Примеры:
# Production:
python setup_telegram_webhook.py 123456:ABC-DEF https://yourdomain.com

# Ngrok:
python setup_telegram_webhook.py 123456:ABC-DEF https://abc123.ngrok.io

# Cloudflare Tunnel:
python setup_telegram_webhook.py 123456:ABC-DEF https://xyz789.trycloudflare.com
```

**Вывод скрипта:**
```
🔐 Сгенерирован новый секретный токен
🔧 Устанавливаю webhook...
   URL: https://yourdomain.com/api/telegram/webhook
   SECRET: xY9z...AbCd

✅ Webhook успешно установлен!

🔑 ВАЖНО! Сохраните секретный токен в переменные окружения:
   TELEGRAM_WEBHOOK_SECRET_TOKEN=xY9z1234567890AbCdEfGh

📝 Добавьте в application.properties:
   telegram.webhook.secret-token=${TELEGRAM_WEBHOOK_SECRET_TOKEN}
```

### 2. Сохранить секретный токен

**Для локальной разработки** (`.env` или переменные окружения):
```bash
# .env
TELEGRAM_WEBHOOK_SECRET_TOKEN=xY9z1234567890AbCdEfGh
```

**Для production** (Docker):
```bash
# В .env или docker-compose.prod.yml
export TELEGRAM_WEBHOOK_SECRET_TOKEN=xY9z1234567890AbCdEfGh
```

**Для production** (переменные окружения сервера):
```bash
# В /etc/environment или systemd service
TELEGRAM_WEBHOOK_SECRET_TOKEN=xY9z1234567890AbCdEfGh
```

### 3. Перезапустить backend

```bash
# Локально
cd dash_bord
./mvnw spring-boot:run

# Docker
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 🔄 Обновление существующего токена

Если у вас уже настроен webhook и вы хотите использовать существующий токен:

```bash
# Установить переменную окружения
export TELEGRAM_WEBHOOK_SECRET_TOKEN=your_existing_token

# Переустановить webhook
python setup_telegram_webhook.py <BOT_TOKEN> <WEBHOOK_URL>
```

Скрипт автоматически использует существующий токен из `TELEGRAM_WEBHOOK_SECRET_TOKEN`.

---

## ✅ Проверка работоспособности

### 1. Проверить что webhook установлен

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Ожидаемый ответ:**
```json
{
  "ok": true,
  "result": {
    "url": "https://yourdomain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

### 2. Проверить логи backend

После отправки сообщения боту в логах НЕ должно быть:
```
[SECURITY] Получен webhook без валидного секретного токена от IP: ...
```

Должно быть:
```
INFO  c.e.d.s.TelegramLinkService - Telegram link consumed successfully
```

### 3. Тест с неправильным токеном (должен провалиться)

```bash
curl -X POST https://yourdomain.com/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: wrong_token" \
  -d '{"message": {"text": "/start"}}'
```

**Ожидаемый ответ:**
```json
{"ok": false, "error": "Unauthorized"}
```

**В логах:**
```
WARN [SECURITY] Получен webhook без валидного секретного токена от IP: 1.2.3.4
```

---

## 🛡️ Уровни защиты

### До исправления ❌
```
Любой IP → POST /api/telegram/webhook → Обработка
```

**Уязвимость:** Злоумышленник может отправлять фейковые webhook запросы.

### После исправления ✅
```
Telegram API → POST /api/telegram/webhook
              + Header: X-Telegram-Bot-Api-Secret-Token
              → Проверка токена
              → Обработка (если токен совпадает)
              
Злоумышленник → POST /api/telegram/webhook
              + Нет токена или неправильный
              → Логирование атаки
              → Ответ 200 OK (но обработка НЕ выполняется)
```

**Почему возвращаем 200 OK даже при ошибке?**
Чтобы не выдавать злоумышленнику информацию о том, что запрос был отклонён. Telegram также не будет повторять запросы.

---

## 🔧 Troubleshooting

### Проблема: "Telegram webhook работает БЕЗ проверки secret token"

**Причина:** Переменная `TELEGRAM_WEBHOOK_SECRET_TOKEN` не установлена.

**Решение:**
1. Сгенерировать токен: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
2. Установить переменную окружения
3. Переустановить webhook: `python setup_telegram_webhook.py ...`
4. Перезапустить backend

### Проблема: Webhook не получает сообщения

**Диагностика:**
```bash
# Проверить webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

**Если `last_error_message` содержит "Wrong response from the webhook":**
- Проверить что `TELEGRAM_WEBHOOK_SECRET_TOKEN` совпадает на backend и в Telegram
- Проверить логи backend: `docker logs projectpulse-backend -f`

**Если `url` пустой или webhook не установлен:**
- URL должен быть HTTPS (не HTTP!)
- URL должен быть публичным (не localhost, не локальная сеть)
- Для локальной разработки используйте ngrok или Cloudflare Tunnel

**Если используете ngrok и webhook не работает после перезапуска:**
- Ngrok генерирует новый URL при каждом запуске (бесплатная версия)
- Нужно заново установить webhook с новым URL
- Решение: используйте платную версию ngrok с постоянным доменом ИЛИ Cloudflare Tunnel

### Проблема: ImportError: No module named 'secrets'

**Решение:** Используйте Python 3.6+
```bash
python3 --version  # Должно быть >= 3.6
```

### Проблема: "Error: bad webhook: HTTPS url must be provided for webhook"

**Причина:** Попытка установить HTTP URL в качестве webhook.

**Решение:**
```bash
# Вариант 1: Использовать ngrok для получения HTTPS URL
ngrok http 8080
# Скопировать https://... URL и использовать его

# Вариант 2: Переключиться на polling режим (без webhook)
curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"
# Реализовать getUpdates polling в backend коде
```

**Для локальной разработки БЕЗ ngrok:**
Если не хотите использовать ngrok, можно временно переключить бота в режим polling:
1. Удалить webhook: `curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"`
2. В backend использовать `getUpdates` API вместо webhook endpoint
3. Бот будет опрашивать Telegram каждые несколько секунд

---

## 📋 Checklist перед production deployment

- [ ] Установлена переменная `TELEGRAM_WEBHOOK_SECRET_TOKEN`
- [ ] Секретный токен НЕ закоммичен в Git (только в .env.example без значения)
- [ ] Webhook установлен с `secret_token` (проверить через getWebhookInfo)
- [ ] Backend проверяет токен (нет warning "работает БЕЗ проверки")
- [ ] Тестовый запрос с неправильным токеном отклонён
- [ ] Логи показывают успешную обработку реальных webhook от Telegram

---

## 🔐 Безопасность секретного токена

### Где НЕ хранить:
- ❌ Прямо в `application.properties` (только `${TELEGRAM_WEBHOOK_SECRET_TOKEN}`)
- ❌ В Git репозитории
- ❌ В логах

### Где хранить:
- ✅ Переменные окружения системы
- ✅ Docker secrets
- ✅ Vault/AWS Secrets Manager (для production)
- ✅ `.env` файл (только для локальной разработки, добавить в .gitignore)

### Ротация токена:
```bash
# 1. Сгенерировать новый токен
NEW_TOKEN=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# 2. Установить в переменные окружения
export TELEGRAM_WEBHOOK_SECRET_TOKEN=$NEW_TOKEN

# 3. Переустановить webhook
python setup_telegram_webhook.py $TELEGRAM_BOT_TOKEN $WEBHOOK_URL

# 4. Перезапустить backend (он подхватит новый токен из env)
docker-compose restart backend
```

---

## 📚 Дополнительная информация

**Документация Telegram Bot API:**
https://core.telegram.org/bots/api#setwebhook

**Параметр `secret_token`:**
> A secret token to be sent in a header "X-Telegram-Bot-Api-Secret-Token" in every webhook request, 1-256 characters. Only characters A-Z, a-z, 0-9, _ and - are allowed. The header is useful to ensure that the request comes from a webhook set by you.

**Рекомендуемая длина токена:** 32-64 символа (urlsafe base64)

---

**Автор исправления:** GitHub Copilot  
**Дата:** 8 апреля 2026  
**Версия:** 1.0
