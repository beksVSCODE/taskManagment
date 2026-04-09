#!/usr/bin/env python3
"""
Скрипт для настройки Telegram webhook
Использует локальный туннель через Cloudflare Tunnel или простой URL
Генерирует секретный токен для защиты webhook от несанкционированных запросов
"""

import sys
import requests
import json
import secrets
from urllib.parse import urljoin


def setup_webhook(bot_token, webhook_url, secret_token=None):
    """Установить webhook для Telegram бота с секретным токеном"""

    if not bot_token:
        print("❌ BOT_TOKEN не указан!")
        return False, None

    if not webhook_url:
        print("❌ WEBHOOK_URL не указан!")
        print("\nДля локальной разработки используй:")
        print("1. ngrok: https://ngrok.com/download")
        print("2. Cloudflare Tunnel")
        print("3. Или деплой на сервер с публичным IP")
        return False, None

    # Убедимся что webhook URL заканчивается правильно
    if not webhook_url.endswith('/api/telegram/webhook'):
        webhook_url = urljoin(webhook_url.rstrip('/'), '/api/telegram/webhook')

    # Генерация секретного токена если не передан
    if not secret_token:
        secret_token = secrets.token_urlsafe(32)
        print(f"🔐 Сгенерирован новый секретный токен")
    else:
        print(f"🔐 Использую существующий секретный токен")

    api_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"

    print(f"🔧 Устанавливаю webhook...")
    print(f"   URL: {webhook_url}")
    print(f"   BOT: {bot_token[:15]}...")
    print(f"   SECRET: {secret_token[:10]}...{secret_token[-10:]}")

    try:
        # Установка webhook с секретным токеном
        response = requests.post(
            api_url,
            json={
                "url": webhook_url,
                "secret_token": secret_token
            },
            timeout=10)
        result = response.json()

        if result.get('ok'):
            print(f"✅ Webhook успешно установлен!")
            print(f"   {result.get('description', 'OK')}")
            print(f"\n🔑 ВАЖНО! Сохраните секретный токен в переменные окружения:")
            print(f"   TELEGRAM_WEBHOOK_SECRET_TOKEN={secret_token}")
            print(f"\n📝 Добавьте в application.properties:")
            print(
                f"   telegram.webhook.secret-token=${{TELEGRAM_WEBHOOK_SECRET_TOKEN}}")
        else:
            print(f"❌ Ошибка: {result.get('description', 'Unknown error')}")
            return False, None

        # Проверка статуса
        print(f"\n📋 Проверяю статус webhook...")
        check_url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
        response = requests.get(check_url, timeout=10)
        info = response.json()

        if info.get('ok'):
            webhook_info = info.get('result', {})
            print(f"✅ Статус webhook:")
            print(f"   URL: {webhook_info.get('url', 'N/A')}")
            print(
                f"   Last error date: {webhook_info.get('last_error_date', 'N/A')}")
            print(
                f"   Pending updates: {webhook_info.get('pending_update_count', 0)}")

            if webhook_info.get('last_error_message'):
                print(
                    f"   ⚠️ Последняя ошибка: {webhook_info.get('last_error_message')}")

        return True, secret_token

    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка сети: {e}")
        return False, None
    except json.JSONDecodeError as e:
        print(f"❌ Ошибка парсинга ответа: {e}")
        return False, None


def get_local_url():
    """Попытаться получить локальный IP"""
    import socket
    try:
        # Определяем локальный IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return f"http://{local_ip}:8080"
    except:
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("🤖 Telegram Webhook Setup")
    print("=" * 60)

    # Получить BOT_TOKEN из переменной окружения или параметра
    import os
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '')

    if len(sys.argv) > 1:
        bot_token = sys.argv[1]

    if not bot_token:
        print("\n⚠️ BOT_TOKEN не найден!")
        print("\nИспользование:")
        print("  python3 setup_telegram_webhook.py <BOT_TOKEN> [WEBHOOK_URL]")
        print("\nПример:")
        print("  python3 setup_telegram_webhook.py 123456:ABC-DEF /path/from/env")
        sys.exit(1)

    # Получить WEBHOOK_URL
    webhook_url = os.getenv('TELEGRAM_WEBHOOK_URL', '')

    if len(sys.argv) > 2:
        webhook_url = sys.argv[2]

    if not webhook_url:
        print("\n⚠️ WEBHOOK_URL не найден!")
        local_url = get_local_url()
        if local_url:
            print(f"💡 Локальный IP: {local_url}")
        print("\nНужен публичный URL. Вариант для локальной разработки:")
        print("  1. Установи ngrok: https://ngrok.com/download")
        print("  2. Запусти: ngrok http 8080")
        print("  3. Скопируй URL (например: https://abc123.ngrok.io)")
        print("  4. Запусти: python3 setup_telegram_webhook.py <TOKEN> https://abc123.ngrok.io")
        sys.exit(1)

    # Проверяем существующий secret token в переменных окружения
    existing_secret = os.getenv('TELEGRAM_WEBHOOK_SECRET_TOKEN', '')

    success, secret_token = setup_webhook(
        bot_token, webhook_url, existing_secret if existing_secret else None)

    if success and secret_token:
        print("\n" + "="*60)
        print("✅ Настройка завершена успешно!")
        print("="*60)
        if not existing_secret:
            print("\n⚠️ НЕ ЗАБУДЬТЕ сохранить секретный токен!")
            print("Без него webhook не будет работать.")

    sys.exit(0 if success else 1)
