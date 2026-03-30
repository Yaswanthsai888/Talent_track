@echo off
echo Starting Talent Track Development Environment...

cd Server

echo Installing dependencies...
call npm install

echo Starting development server...
call npm run dev
