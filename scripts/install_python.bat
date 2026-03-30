@echo off
setlocal EnableDelayedExpansion

echo Checking Python installation...

REM Try to find Python 3.11 specifically
where py 2>NUL
if %ERRORLEVEL% EQU 0 (
    py -3.11 --version 2>NUL
    if !ERRORLEVEL! EQU 0 (
        echo Found Python 3.11
        py -3.11 -c "print('Python 3.11 verified')"
        exit /b 0
    )
)

echo.
echo ERROR: Python 3.11 is required but not found.
echo.
echo Please follow these steps:
echo 1. Download Python 3.11.6 from:
echo    https://www.python.org/downloads/release/python-3116/
echo 2. Run the installer
echo 3. IMPORTANT: Check "Add Python 3.11 to PATH"
echo 4. After installation, restart your terminal
echo.
echo Current installed Python version:
python --version
echo.
exit /b 1
