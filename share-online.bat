@echo off
title Share LMS Online (Localtunnel)
echo ======================================================================
echo    SHARING ONLINE LMS VIA SECURE PUBLIC TUNNEL
echo ======================================================================
echo.

:: 1. Add portable Node.js & npx to temporary session PATH
set "PATH=C:\Users\abhin\.gemini\antigravity\scratch\tools\node-v20.18.0-win-x64;%PATH%"

echo [INFO] Connecting port 8080 to a secure public URL...
echo [IMPORTANT] Make sure start-lms.bat is already running in another window!
echo.
echo When the link appears below (e.g. https://xxxx.loca.lt):
echo You can copy and share it with ChatGPT, Claude, or test on your phone.
echo.
echo (Press Ctrl+C anytime to stop sharing)
echo ======================================================================
echo.

call npx -y localtunnel --port 8080

pause
