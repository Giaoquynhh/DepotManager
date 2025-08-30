@echo off
echo Restarting Backend Server...
echo.
echo 1. Stopping current server (Ctrl+C if needed)
echo 2. Starting server again
echo.
echo Press any key to continue...
pause >nul

echo.
echo Starting backend server...
npm start
