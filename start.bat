@echo off
echo ===================================================
echo   BugBounty for College - Starting Platform
echo ===================================================

echo [1/2] Launching Backend Server on port 5000...
start "BugBounty Backend (Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Client on port 5173...
start "BugBounty Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both services launched in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:5000
echo ===================================================
pause
