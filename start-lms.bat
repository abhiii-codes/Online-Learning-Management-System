@echo off
title Online LMS - Jakarta Servlets & Tomcat 10
echo ======================================================================
echo    ONLINE LEARNING MANAGEMENT SYSTEM (LMS)
echo    3rd-Semester CSE Java Web-Based Project (Rubric: 33 Marks)
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Locate Maven
set "MAVEN_CMD=mvn"
where mvn >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "..\tools\apache-maven-3.9.9\bin\mvn.cmd" (
        set "MAVEN_CMD=..\tools\apache-maven-3.9.9\bin\mvn.cmd"
    ) else if exist "C:\Users\abhin\.gemini\antigravity\scratch\tools\apache-maven-3.9.9\bin\mvn.cmd" (
        set "MAVEN_CMD=C:\Users\abhin\.gemini\antigravity\scratch\tools\apache-maven-3.9.9\bin\mvn.cmd"
    ) else (
        echo [ERROR] Maven not found in PATH or tools directory.
        pause
        exit /b 1
    )
)

echo [INFO] Starting Tomcat 10 Embedded Web Server on Port 8080...
echo [INFO] Web Application URL: http://localhost:8080/index.html
echo.
echo Press Ctrl+C in this terminal when you want to stop the server.
echo ======================================================================
echo.

:: Automatically open browser after 3 seconds in the background
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080/index.html"

:: Execute Embedded Tomcat Server
call %MAVEN_CMD% exec:java

pause
