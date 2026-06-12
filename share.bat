@echo off
cd /d %~dp0
if not exist package.json (
  echo This script must be run from the project root.
  pause
  exit /b 1
)

echo Starting server in a new terminal...
start "Server" cmd /k "npm start"

echo Waiting 3 seconds for server startup...
timeout /t 3 /nobreak >nul

echo Starting LocalTunnel to expose port 3000...
call npx localtunnel --port 3000

echo\nWhen you are finished, close this window and the server terminal.
pause
