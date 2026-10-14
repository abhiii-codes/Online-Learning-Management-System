# Online LMS - 1-Click PowerShell Launcher
Set-Location -Path $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   ONLINE LEARNING MANAGEMENT SYSTEM (LMS)" -ForegroundColor Green
Write-Host "   3rd-Semester CSE Java Web-Based Project (Rubric: 33 Marks)" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Find Maven
$mavenCmd = "mvn"
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    $toolsMaven = "C:\Users\abhin\.gemini\antigravity\scratch\tools\apache-maven-3.9.9\bin\mvn.cmd"
    if (Test-Path $toolsMaven) {
        $mavenCmd = $toolsMaven
    } else {
        Write-Error "Maven not found. Please install Maven or add it to PATH."
        exit 1
    }
}

Write-Host "[INFO] Starting Tomcat 10 on port 8080..." -ForegroundColor Green
Write-Host "[INFO] Web app URL: http://localhost:8080/index.html" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server anytime.`n"

# Open browser automatically after delay
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:8080/index.html"
} | Out-Null

# Run server
& $mavenCmd exec:java
