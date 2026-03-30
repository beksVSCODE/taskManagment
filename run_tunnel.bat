@echo off
REM Запуск Cloudflare Tunnel для локального сервера

echo.
echo ================================
echo  Cloudflare Tunnel Setup
echo ================================
echo.

cd /d "%~dp0"

if not exist cloudflared.exe (
    echo Скачиваю cloudflared...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/download/2024.3.0/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe' -UseBasicParsing"
)

echo.
echo Запускаю туннель на localhost:8080...
echo.
echo ВАЖНО: Скопируй URL ниже (https://...) и используй его для webhook!
echo.

cloudflared.exe tunnel --url http://localhost:8080

pause
