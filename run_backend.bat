@echo off
echo ========================================================
echo   Starting SentraCity FastAPI Backend Server
echo ========================================================
cd /d "%~dp0"
python backend\run.py
pause

