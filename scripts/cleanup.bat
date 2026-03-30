@echo off
setlocal

set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo Cleaning up existing virtual environment...

IF EXIST "%PROJECT_ROOT%\venv" (
    echo Removing existing venv directory...
    rmdir /s /q "%PROJECT_ROOT%\venv"
) ELSE (
    echo No existing venv found.
)

echo Cleanup complete!
endlocal
