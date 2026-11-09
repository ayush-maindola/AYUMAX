
@echo off
cd /d "%~dp0"

echo Starting AYUMAX...

start "AYUMAX Backend" cmd /k "python backend\app.py"

start "AYUMAX Website" cmd /k "python -m http.server 5500 --bind 127.0.0.1"

timeout /t 3 >nul

start "" "http://127.0.0.1:5500/index.html"

echo AYUMAX is starting!
