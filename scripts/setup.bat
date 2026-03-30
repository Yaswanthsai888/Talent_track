@echo off
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo Starting setup process...

REM Run cleanup first
call "%~dp0cleanup.bat"

REM Check Python version
call "%~dp0install_python.bat"
if errorlevel 1 (
    echo Setup failed: Python 3.11 is required
    pause
    exit /b 1
)

echo Creating Python virtual environment...
py -3.11 -m venv "%PROJECT_ROOT%\venv"
call "%PROJECT_ROOT%\venv\Scripts\activate.bat"

echo Installing requirements...
python -m pip install --upgrade pip

echo Installing packages from requirements.txt...
pip install --no-cache-dir -r "%PROJECT_ROOT%\requirements.txt" 2>&1
if errorlevel 1 (
    echo.
    echo Failed to install packages from requirements.txt
    echo Please check the error messages above
    pause
    exit /b 1
)

echo Setup complete!
endlocal
pause
