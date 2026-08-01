@echo off
title Job Match Command Center V1
cd /d "%~dp0"
if not exist .env copy .env.example .env
docker compose up --build
pause
