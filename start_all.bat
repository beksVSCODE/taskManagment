@echo off
chcp 65001 >nul
title Project Pulse - Запуск системы

echo ============================================
echo   PROJECT PULSE - Запуск всех сервисов
echo ============================================
echo.

REM === 1. Убиваем старые процессы ===
echo [1/4] Останавливаем старые процессы...
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM === 2. Запускаем Backend ===
echo [2/4] Запускаем Spring Boot Backend (порт 8080)...
start "Spring Boot Backend" cmd /k "cd /d %~dp0dash_bord && set JAVA_HOME=C:\Program Files\Java\jdk-21 && set PATH=C:\Program Files\Java\jdk-21\bin;%PATH% && mvnw.cmd spring-boot:run"

echo     Ждем запуска бэкенда (60 секунд)...
timeout /t 60 /nobreak >nul

REM === 3. Запускаем Cloudflare Tunnel ===
echo [3/4] Запускаем Cloudflare туннель...
start "Cloudflare Tunnel" cmd /k "%~dp0cloudflared.exe tunnel --url http://localhost:8080"

echo     Ждем получения URL туннеля (15 секунд)...
timeout /t 15 /nobreak >nul

REM === 4. Запускаем Frontend ===
echo [4/4] Запускаем Frontend (порт 3000)...
start "Vite Frontend" cmd /k "cd /d %~dp0project-pulse && npm run dev"

echo.
echo ============================================
echo   ВСЕ СЕРВИСЫ ЗАПУЩЕНЫ!
echo ============================================
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8080
echo.
echo   ВАЖНО: После запуска туннеля:
echo   1. Скопируй URL из окна "Cloudflare Tunnel"
echo      (формат: https://xxxx-yyyy.trycloudflare.com)
echo   2. Запусти update_webhook.bat с этим URL
echo      или задай вебхук вручную
echo.
echo   Telegram Bot: @dash_bord_bot
echo ============================================
pause
