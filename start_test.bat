@echo off
title TextGenHub Render Test Server
color 0a

echo ==============================================
echo   TextGenHub (Рендер-версія) - Локальний тест
echo ==============================================
echo.

start "" "http://localhost:8000/app/index.html"
python server.py

pause
