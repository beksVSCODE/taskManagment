@echo off
chcp 65001 >nul
title Обновление Telegram Webhook

if "%1"=="" (
    echo ============================================
    echo   Обновление вебхука Telegram бота
    echo ============================================
    echo.
    echo Использование: update_webhook.bat ^<TUNNEL_URL^>
    echo.
    echo Пример:
    echo   update_webhook.bat https://bolt-lime-mating-inherited.trycloudflare.com
    echo.
    echo Где взять URL туннеля?
    echo   Посмотри в окно "Cloudflare Tunnel" - там написано URL
    echo   (строка вида: https://xxxx-yyyy.trycloudflare.com)
    echo.
    set /p TUNNEL_URL="Введи URL туннеля: "
) else (
    set TUNNEL_URL=%1
)

set BOT_TOKEN=8739152722:AAFM0Sls149lFE2lktJrdq06xvw52GzCLp0
set WEBHOOK_URL=%TUNNEL_URL%/api/telegram/webhook

echo.
echo Устанавливаю вебхук: %WEBHOOK_URL%
echo.

curl -s -X POST "https://api.telegram.org/bot%BOT_TOKEN%/setWebhook" -H "Content-Type: application/json" -d "{\"url\":\"%WEBHOOK_URL%\",\"allowed_updates\":[\"message\",\"callback_query\"]}"

echo.
echo.
echo Проверяю статус вебхука...
curl -s "https://api.telegram.org/bot%BOT_TOKEN%/getWebhookInfo"
echo.
echo.
echo ============================================
echo   Готово! Telegram бот настроен.
echo ============================================
pause
