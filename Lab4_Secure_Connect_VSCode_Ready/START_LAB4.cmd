@echo off
cd /d "%~dp0"
if not exist ".env" (
  echo Create and configure the .env file using .env.example first.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 (
  pause
  exit /b 1
)
call npm start
pause
