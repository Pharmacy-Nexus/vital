@echo off
cd /d "%~dp0"
start "" "http://localhost:8080/?loop=1"
py -m http.server 8080
pause
