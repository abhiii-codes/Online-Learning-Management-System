@echo off
title Online LMS - Jakarta Servlets & Tomcat 10
echo ======================================================================
echo    ONLINE LEARNING MANAGEMENT SYSTEM (LMS)
echo    Pure Jakarta Servlets 6.0 & HikariCP & MySQL / H2
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Check Java JDK
java -version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java JDK is not installed or not found in your system PATH!
    echo Please install Java JDK 17 or higher from https://adoptium.net/
    echo.
    pause
    exit /b 1
)

:: 2. Locate Maven or Maven Wrapper (mvnw)
set "MAVEN_CMD=mvn"
where mvn >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "%~dp0mvnw.cmd" (
        set "MAVEN_CMD=%~dp0mvnw.cmd"
    ) else if exist "..\tools\apache-maven-3.9.9\bin\mvn.cmd" (
        set "MAVEN_CMD=..\tools\apache-maven-3.9.9\bin\mvn.cmd"
    ) else if exist "C:\Users\abhin\.gemini\antigravity\scratch\tools\apache-maven-3.9.9\bin\mvn.cmd" (
        set "MAVEN_CMD=C:\Users\abhin\.gemini\antigravity\scratch\tools\apache-maven-3.9.9\bin\mvn.cmd"
    ) else (
        echo [ERROR] Maven not found.
        pause
        exit /b 1
    )
)

echo [INFO] Starting Tomcat 10 Embedded Web Server on Port 8080...
echo [INFO] Please wait a few moments while Tomcat initializes...
echo.
echo ======================================================================
echo Once started, open your browser at: http://localhost:8080
echo Press Ctrl+C in this terminal when you want to stop the server.
echo ======================================================================
echo.

:: Automatically open browser after 10 seconds in the background to allow Tomcat initialization
start "" /b cmd /c "timeout /t 10 /nobreak >nul & start http://localhost:8080"

:: Execute Embedded Tomcat Server
call %MAVEN_CMD% exec:java

pause
