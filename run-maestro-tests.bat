@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  FitMetrics Maestro E2E Test Runner
REM ═══════════════════════════════════════════════════════════════════
REM  Usage: run-maestro-tests.bat [test_number]
REM  Example: run-maestro-tests.bat 08   (runs only tab navigation)
REM          run-maestro-tests.bat all  (runs all tests)
REM ═══════════════════════════════════════════════════════════════════

setlocal

REM Set environment variables
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot

REM Check adb is running
echo [1/3] Checking emulator...
adb devices | findstr "device" >nul
if %errorlevel% neq 0 (
    echo ERROR: No emulator detected. Start your Android emulator first.
    echo   Run: %ANDROID_HOME%\emulator\emulator.exe -avd Pixel_7
    exit /b 1
)
echo   Emulator found.

REM Check Maestro
echo [2/3] Checking Maestro...
where maestro >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Maestro not installed.
    echo   Install: curl -Ls "https://get.maestro.mobile.dev" | bash
    exit /b 1
)
echo   Maestro found.

REM Run tests
echo [3/3] Running Maestro E2E tests...
echo.

if "%1"=="all" (
    echo Running ALL Maestro tests...
    maestro test .maestro/
) else if "%1"=="" (
    echo Running ALL Maestro tests...
    maestro test .maestro/
) else (
    echo Running test %1...
    maestro test .maestro/%1_*.yaml
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo  Maestro E2E tests complete!
echo ═══════════════════════════════════════════════════════════════════

endlocal
