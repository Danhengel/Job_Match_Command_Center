@echo off
cd /d "%~dp0"
echo This will erase all V1 users and data.
pause
docker compose down -v
pause
