@echo off
REM Script to start the backend with proper environment variables

setlocal enabledelayedexpansion

REM Set environment variables
set SPRING_PROFILES_ACTIVE=dev

REM Navigate to backend directory
cd /d c:\Users\Admin\Desktop\taskManagment\dash_bord

REM Run Maven
echo Starting backend with dev profile...
call mvnw.cmd spring-boot:run

pause
