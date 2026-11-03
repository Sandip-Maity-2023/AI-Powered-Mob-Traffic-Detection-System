@echo off
echo ========================================================
echo   Launching SentraCity AI Smart City Command Center
echo ========================================================
echo Starting FastAPI Backend...
start "SentraCity FastAPI Backend" cmd /k "cd /d %~dp0 && python backend\run.py"

echo Starting React Frontend...
start "SentraCity React Frontend" cmd /k "cd /d %~dp0smart-city-prediction-main && npm run dev"

echo System services launched! Open http://localhost:3000 in your browser.
pause

