@echo off
setlocal EnableDelayedExpansion

echo Starting Talent Track local deployment...

REM Set working directory to project root
cd /d "%~dp0.."

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running! Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Start Docker containers
echo Starting Docker services...
docker-compose -f docker-compose.local.yml up -d

REM Wait for services to be ready
timeout /t 5 /nobreak

REM Activate Python virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call "venv\Scripts\activate.bat"
)

REM Start Backend
echo Starting Backend...
cd Server
start "Backend" cmd /k "npm install && npm run dev"

REM Start Frontend
echo Starting Frontend...
cd ..\Client
start "Frontend" cmd /k "npm install && npm run dev"

echo.
echo Services starting up...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo MongoDB: localhost:27017
echo Redis: localhost:6379
echo.
echo Press Ctrl+C in individual windows to stop services
echo Run 'docker-compose -f docker-compose.local.yml down' to stop databases
echo.

pause
endlocal
