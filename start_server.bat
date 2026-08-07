@echo off
chcp 65001 >nul
title TextGenHub - Web Server

echo =========================================
echo       TextGenHub + WebLLM
echo =========================================
echo.
echo Для використання "Вбудованого в браузер ШІ" (WebGPU)
echo проект має бути запущений через локальний сервер.
echo.
echo Запускаю Python HTTP Server на порту 8080...
echo.

start "" "http://localhost:8080/app/index.html"
python server.py

pause
